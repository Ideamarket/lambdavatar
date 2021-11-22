import { Handler } from 'aws-lambda'
import { S3, Endpoint } from 'aws-sdk'

import {
  fail,
  success,
  processImage,
  getUrlFromS3,
  putImageOnS3,
} from './helpers'
import providers from './providers'

const s3 = process.env.IS_OFFLINE
  ? new S3({
      s3ForcePathStyle: true,
      endpoint: new Endpoint(`${process.env.S3_ENDPOINT}`),
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    })
  : new S3()

const main: Handler = async (event: any) => {
  if (!event || !event.pathParameters) {
    return fail('missing request parameters')
  }

  const { provider: providerName, username } = event.pathParameters
  const provider = providers[providerName]
  if (!provider) {
    return fail('unknown provider')
  }

  if (providerName !== 'wikipedia') {
    // Run a basic sanitycheck on the username
    if (!/^[a-zA-Z0-9-_()]{1,100}$/g.test(username)) {
      return fail('invalid username')
    }
  }

  let s3Ret: any

  try {
    s3Ret = await getUrlFromS3(s3, `${providerName}/${username}`)
    if (s3Ret && !s3Ret.expired) {
      return success(s3Ret.url)
    }
  } catch (ex) {
    return failedResponse('internal error (1)')
  }

  // Image does not exist. Try to pull it
  let image
  try {
    image = await provider(username)

    if (!image) {
      return failedResponse('could not retrieve image from provider', s3Ret)
    }
  } catch (ex) {
    console.log(ex)
    return failedResponse('could not retrieve image from provider', s3Ret)
  }

  image = await processImage(image)
  try {
    const s3Url = await putImageOnS3(s3, `${providerName}/${username}`, image)
    return success(s3Url)
  } catch (ex) {
    return failedResponse('internal error (2)', s3Ret)
  }
}

const failedResponse = (errorMessage, s3Ret = undefined) => {
  if (s3Ret && s3Ret.expired) {
    return success(s3Ret.url)
  }

  return fail(errorMessage)
}

export default main
