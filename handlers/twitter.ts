import { Handler } from 'aws-lambda'
import axios from 'axios'
import { S3, Endpoint } from 'aws-sdk'
import { getUrlFromS3, putImageOnS3 } from '../helpers/helpers'

const twitter: Handler = async (event: any) => {
  const s3 = process.env.IS_OFFLINE
    ? new S3({
        s3ForcePathStyle: true,
        endpoint: new Endpoint(process.env.s3Endpoint),
        accessKeyId: process.env.s3AccessKey,
        secretAccessKey: process.env.s3SecretAccessKey,
      })
    : new S3()

  if (!event?.pathParameters?.id) {
    return { statusCode: 400, statusText: 'No id provided' }
  }

  const imageUrl = await getUrlFromS3(s3, `twitter/${event.pathParameters.id}`)
  if (imageUrl) {
    const response = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: imageUrl }),
    }
    return response
  }

  const params = {
    usernames: event.pathParameters.id,
    'user.fields': 'profile_image_url',
  }

  const headers = {
    authorization: `BEARER ${process.env.twitterBearerToken}`,
  }
  const res = await axios.get('https://api.twitter.com/2/users/by', {
    params,
    headers,
  })

  if (res.data?.errors?.length > 0) {
    return { statusCode: 400, statusText: res.data.errors[0].details }
  }

  const profileUrl = res.data.data[0].profile_image_url

  const s3Url = await putImageOnS3(
    s3,
    `twitter/${event.pathParameters.id}`,
    profileUrl
  )

  const response = {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: s3Url }),
  }

  return response
}

export default twitter
