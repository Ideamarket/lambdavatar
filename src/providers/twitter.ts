import got from 'got'
import * as tunnel from 'tunnel'

const TWITTER_BEARER_TOKEN =
  'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

const { PROXY_HOST, PROXY_PORT, PROXY_AUTH } = process.env
const proxyAgentConfiguration = PROXY_HOST &&
  PROXY_PORT && {
    https: tunnel.httpsOverHttp({
      proxy: {
        host: PROXY_HOST,
        port: parseInt(PROXY_PORT),
        proxyAuth: PROXY_AUTH,
      },
    }),
  }

export default async function run(username: string) {
  // Get a fresh guest token
  const { body: guestBody } = await got.post(
    'https://api.twitter.com/1.1/guest/activate.json',
    {
      https: {
        rejectUnauthorized: false,
      },
      responseType: 'json',
      headers: {
        authorization: TWITTER_BEARER_TOKEN,
        origin: 'https://twitter.com',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
      },
      agent: proxyAgentConfiguration as any,
    }
  )
  const guestToken = (guestBody as any).guest_token

  // Request api endpoint with guest token. Bearer auth is hardcoded to this value.
  const payload = { screen_name: username, withHighlightedLabel: true }
  const { body: apiBody } = await got(
    `https://twitter.com/i/api/graphql/ZRnOhhXPwue_JGILb9TNug/UserByScreenName?variables=${encodeURIComponent(
      JSON.stringify(payload)
    )}`,
    {
      headers: {
        authorization: TWITTER_BEARER_TOKEN,
        'x-guest-token': guestToken,
      },
      agent: proxyAgentConfiguration as any,
    }
  )

  const body = JSON.parse(apiBody)

  if (body.data?.user?.legacy) {
    const rawImageURL = body.data.user.legacy.profile_image_url_https
    const imageURL = rawImageURL.replace(
      /_(?:bigger|mini|normal)\./,
      `_400x400.`
    )

    // The final image can be pulled without proxy
    const { body: imgBody } = await got(imageURL, { responseType: 'buffer' })
    return imgBody
  }

  return null
}
