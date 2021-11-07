import * as sharp from 'sharp'
import { S3 } from 'aws-sdk'

export async function processImage(imageData: Buffer): Promise<Buffer> {
  return await sharp(imageData)
    .resize({ width: parseInt(process.env.IMAGE_WIDTH as any) })
    .png()
    .toBuffer()
}

export async function getUrlFromS3(
  bucket: S3,
  profileId: string
): Promise<string | null> {
  try {
    let s3Image = await bucket
      .getObject({
        Bucket: process.env.S3_BUCKET,
        Key: profileId + '.png',
      } as any)
      .promise()

    // Check to see if cached image was last updated prior to max age
    if (
      s3Image.LastModified &&
      new Date(Date.now() - parseInt(process.env.IMAGE_MAX_AGE as any)) >
        s3Image?.LastModified
    ) {
      return null
    }

    if (process.env.IS_OFFLINE) {
      return `http://localhost:8000/${process.env.S3_BUCKET}/${profileId}.png`
    } else {
      return `https://s3.amazonaws.com/${
        process.env.S3_BUCKET
      }/${encodeURIComponent(profileId)}.png`
    }
  } catch (err) {
    return null
  }
}

export const putImageOnS3 = async (
  bucket: S3,
  profileId: string,
  image: Buffer
): Promise<string> => {
  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: profileId + '.png',
    Body: image,
    CacheControl: `public, max-age=${process.env.IMAGE_MAX_AGE}`,
    ContentType: 'image/png;charset=utf-8',
  }

  await bucket.putObject(s3Params as any).promise()

  if (process.env.IS_OFFLINE) {
    return `http://localhost:8000/${process.env.S3_BUCKET}/${profileId}.png`
  } else {
    return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${profileId}.png`
  }
}

export function fail(reason: string) {
  return {
    statusCode: 400,
    headers: {
      'content-type': 'application/json',
      'cache-control': `public, max-age=${process.env.IMAGE_MAX_AGE}`,
      'access-control-allow-origin': '*',
    },
    body: JSON.stringify({
      success: false,
      error: reason,
    }),
  }
}

export function success(url: string) {
  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': `public, max-age=${process.env.IMAGE_MAX_AGE}`,
      'access-control-allow-origin': '*',
    },
    body: JSON.stringify({
      success: true,
      url: url,
    }),
  }
}
