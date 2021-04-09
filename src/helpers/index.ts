import * as sharp from 'sharp'
import { S3 } from 'aws-sdk'

export async function decreaseImageSize(imageData: Buffer): Promise<Buffer> {
  const smallImage = await sharp(imageData)
    .resize({ width: parseInt(process.env.imageWidth) })
    .png()
    .toBuffer()
  return smallImage
}

export async function getUrlFromS3(
  bucket: S3,
  profileId: string
): Promise<string | null> {
  try {
    let s3Image = await bucket
      .getObject({ Bucket: process.env.bucket, Key: profileId + '.png' })
      .promise()

    // Check to see if cached image was last updated prior to check by date
    if (
      s3Image.LastModified &&
      new Date(Date.now() - parseInt(process.env.checkByDate)) >
        s3Image?.LastModified
    ) {
      return null
    }

    if (process.env.IS_OFFLINE) {
      return `http://localhost:8000/${process.env.bucket}/${profileId}.png`
    } else {
      return `https://s3.amazonaws.com/${process.env.bucket}/${profileId}.png`
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
    Bucket: process.env.bucket,
    Key: profileId + '.png',
    Body: image,
    ContentType: 'image/png',
    ACL: 'public-read',
  }

  await bucket.putObject(s3Params).promise()

  if (process.env.IS_OFFLINE) {
    return `http://localhost:8000/${process.env.bucket}/${profileId}.png`
  } else {
    return `https://s3.amazonaws.com/${process.env.bucket}/${profileId}.png`
  }
}

export function fail(reason: string) {
  return {
    statusCode: 400,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      success: false,
      error: reason,
    }),
  }
}

export function success(url: string) {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      success: true,
      url: url,
    }),
  }
}
