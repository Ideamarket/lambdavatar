import { Handler } from 'aws-lambda'
import { S3, Endpoint } from 'aws-sdk'
import fetch from 'node-fetch'

import {
  processImage,
  getLambdavatarFromS3,
  updateLambdavatarInS3,
  finalResponse,
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
    return finalResponse({
      statusCode: 400,
      message: 'Missing request parameters',
    })
  }

  let { provider: providerName, username } = event.pathParameters
  const pullLambdavatarImage = providers[providerName]
  if (!pullLambdavatarImage) {
    return finalResponse({ statusCode: 400, message: 'Unknown provider' })
  }

  if (providerName === 'wikipedia') {
    const res = await fetch(
      `http://localhost:3001/api/markets/wikipedia/validPageTitle?title=${username}`
    )
    if (!res.ok) {
      return finalResponse({ statusCode: 400, message: 'Invalid username' })
    }
    const response = await res.json()
    username = response.data.validPageTitle
  }

  if (providerName !== 'wikipedia') {
    // Run a basic sanitycheck on the username
    if (!/^[a-zA-Z0-9-_()]{1,100}$/g.test(username)) {
      return finalResponse({ statusCode: 400, message: 'Invalid username' })
    }
  }

  // Fetch lambdavatar from S3
  const lambdavatar = await getLambdavatarFromS3(
    s3,
    `${providerName}/${username}`
  )
  if (lambdavatar && !lambdavatar.expired) {
    return finalResponse({ statusCode: 200, lambdavatar })
  }

  // Lamdavatar in S3 is either expired or does not exist. Try to pull it
  let lambdavatarImage: Buffer | null | undefined = undefined
  try {
    lambdavatarImage = await pullLambdavatarImage(username)
  } catch (error) {
    console.error(error)
  }
  if (!lambdavatarImage) {
    if (lambdavatar) {
      return finalResponse({ statusCode: 200, lambdavatar })
    }
    return finalResponse({
      statusCode: 500,
      message: 'Could not retrieve image from provider',
    })
  }

  lambdavatarImage = await processImage(lambdavatarImage)
  const latestLambdavatar = await updateLambdavatarInS3(
    s3,
    `${providerName}/${username}`,
    lambdavatarImage
  )
  if (latestLambdavatar || lambdavatar) {
    return finalResponse({
      statusCode: 200,
      lambdavatar: latestLambdavatar ?? lambdavatar,
    })
  }
  return finalResponse({
    statusCode: 500,
    message: 'Could not update latest lambdavatar in S3',
  })
}

export default main
