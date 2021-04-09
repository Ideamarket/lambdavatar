import { Handler } from 'aws-lambda'
import { S3, Endpoint } from 'aws-sdk'
import {
  fail,
  success,
  decreaseImageSize,
  getUrlFromS3,
  putImageOnS3,
} from './helpers'

import { twitter, substack } from './providers'

const providers = {
  twitter,
  substack,
}

const s3 = process.env.IS_OFFLINE
  ? new S3({
      s3ForcePathStyle: true,
      endpoint: new Endpoint(`${process.env.S3_ENDPOINT}`),
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    })
  : new S3()

/*
      TODO
        - convert jpeg to png
        - fix lint-staged
        - serverless warnings
*/

const main: Handler = async (event: any) => {
  if (!event || !event.pathParameters) {
    return fail('missing request parameters')
  }

  const { provider: providerName, username } = event.pathParameters
  const provider = providers[providerName]
  if (!provider) {
    return fail('unknown provider')
  }

  // Run a basic sanitycheck on the username
  if (!/^[a-zA-Z0-9-_]{1,100}$/g.test(username)) {
    return fail('invalid username')
  }

  let s3Url = await getUrlFromS3(s3, `${providerName}/${username}`)
  if (s3Url) {
    return success(s3Url)
  }

  // Image does not exist. Try to pull it
  let image
  try {
    image = await provider(username)
  } catch (ex) {
    console.log(ex)
    return fail('could not retrieve image from provider')
  }

  image = await decreaseImageSize(image)

  s3Url = await putImageOnS3(s3, `${providerName}/${username}`, image)

  return success(s3Url)
}

export default main
