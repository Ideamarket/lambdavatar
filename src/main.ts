import { Handler } from 'aws-lambda'
import { S3, Endpoint } from 'aws-sdk'
import { decreaseImageSize, getUrlFromS3, putImageOnS3 } from './helpers'

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
  : new S3() // TODO - correct for online?

/*
      TODO
        - fail helper function
        - replace axios with got
        - fix twitter with proxy
        - convert jpeg to png
        - fix lint-staged
*/

const main: Handler = async (event: any) => {
  if (!event || !event.pathParameters) {
    return { statusCode: 400, statusText: 'invalid parameters' } // TODO: Add fail func in handler
  }

  const { provider: providerName, username } = event.pathParameters
  const provider = providers[providerName]
  if (!provider) {
    return { statusCode: 400, statusText: 'unknown provider' }
  }

  // TODO: Check username

  let s3Url = await getUrlFromS3(s3, `${providerName}/${username}`)
  if (s3Url) {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: s3Url }),
    }
  }

  // Image does not exist. Try to pull it
  let image
  try {
    image = await provider(username)
  } catch (ex) {
    return { statusCode: 400, statusText: 'could not load image url' }
  }

  image = await decreaseImageSize(image)

  s3Url = await putImageOnS3(s3, `${providerName}/${username}`, image)

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: s3Url }),
  }
}

export default main
