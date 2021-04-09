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
      endpoint: new Endpoint(`${process.env.s3Endpoint}`),
      accessKeyId: process.env.s3AccessKey,
      secretAccessKey: process.env.s3SecretAccessKey,
    })
  : new S3()

/*
      TODO
        - replace axios with got
        - fix twitter with proxy
        - convert jpeg to png
        - fix lint-staged
        - check username
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

  // TODO: Check username

  let s3Url = await getUrlFromS3(s3, `${providerName}/${username}`)
  if (s3Url) {
    return success(s3Url)
  }

  // Image does not exist. Try to pull it
  let image
  try {
    image = await provider(username)
  } catch (ex) {
    return fail('could not retrieve image from provider')
  }

  image = await decreaseImageSize(image)

  s3Url = await putImageOnS3(s3, `${providerName}/${username}`, image)

  return success(s3Url)
}

export default main
