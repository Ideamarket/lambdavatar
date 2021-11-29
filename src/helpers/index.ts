import * as sharp from 'sharp'
import { S3 } from 'aws-sdk'

export async function processImage(imageData: Buffer): Promise<Buffer> {
  return await sharp(imageData)
    .resize({ width: parseInt(process.env.IMAGE_WIDTH as any) })
    .png()
    .toBuffer()
}

export async function getLambdavatarFromS3(
  bucket: S3,
  profileId: string
): Promise<Lambdavatar | null> {
  try {
    let s3Image = await bucket
      .getObject({
        Bucket: process.env.S3_BUCKET,
        Key: profileId + '.png',
      } as any)
      .promise()

    // return null if nothing is found in S3
    if (!s3Image) {
      return null
    }

    let expired = false
    let url = ''
    // Check to see if cached image was last updated prior to max age
    if (
      s3Image.LastModified &&
      new Date(Date.now() - parseInt(process.env.IMAGE_MAX_AGE as any)) >
        s3Image.LastModified
    ) {
      expired = true
    }

    if (process.env.IS_OFFLINE) {
      url = `http://localhost:8000/${process.env.S3_BUCKET}/${profileId}.png`
    } else {
      url = `https://s3.amazonaws.com/${
        process.env.S3_BUCKET
      }/${encodeURIComponent(profileId)}.png`
    }

    const lambdavatar: Lambdavatar = { url, expired }
    return lambdavatar
  } catch (error) {
    console.info(error)
    return null
  }
}

export async function updateLambdavatarInS3(
  bucket: S3,
  profileId: string,
  image: Buffer
): Promise<Lambdavatar | null> {
  try {
    const s3Params = {
      Bucket: process.env.S3_BUCKET,
      Key: profileId + '.png',
      Body: image,
      CacheControl: `public, max-age=${process.env.IMAGE_MAX_AGE}`,
      ContentType: 'image/png;charset=utf-8',
    }
    await bucket.putObject(s3Params as any).promise()

    const expired = false
    let url = ''
    if (process.env.IS_OFFLINE) {
      url = `http://localhost:8000/${process.env.S3_BUCKET}/${profileId}.png`
    } else {
      url = `https://s3.amazonaws.com/${
        process.env.S3_BUCKET
      }/${encodeURIComponent(profileId)}.png`
    }

    const lambdavatar: Lambdavatar = { url, expired }
    return lambdavatar
  } catch (error) {
    console.error(error)
    return null
  }
}

export function finalResponse({
  statusCode,
  message = '',
  lambdavatar = null,
}: {
  statusCode: number
  message?: string
  lambdavatar?: Lambdavatar | null
}) {
  const headers = {
    'content-type': 'application/json',
    'cache-control': `public, max-age=${process.env.IMAGE_MAX_AGE}`,
    'access-control-allow-origin': '*',
  }

  if (!lambdavatar) {
    console.error(message)
    return fail({ statusCode, headers, message })
  }
  if (lambdavatar.expired) {
    console.error('Returning expired lambdavatar')
  }
  return success({ statusCode, headers, url: lambdavatar.url })
}

function fail({
  statusCode,
  headers,
  message,
}: {
  statusCode: number
  headers: any
  message: string
}) {
  return {
    statusCode,
    headers,
    body: JSON.stringify({ success: false, error: message }),
  }
}

function success({
  statusCode,
  headers,
  url,
}: {
  statusCode: number
  headers: any
  url: string
}) {
  return {
    statusCode,
    headers,
    body: JSON.stringify({ success: true, url }),
  }
}

export type Lambdavatar = {
  url: string
  expired: boolean
}
