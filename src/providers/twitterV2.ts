import got from 'got'

const TWITTER_BEARER_TOKEN =
  'Bearer AAAAAAAAAAAAAAAAAAAAAIbbVwEAAAAAhtnPNulJjP%2F3SwrBLWgDIClO3ik%3DHj92XrnPivlaZ165LV8seiOdRg0nW8j3ZV6V7BNSev4C3SJWK6'

export default async function run(username: string) {
  const res = await got(
    `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url`,
    {
      headers: {
        authorization: TWITTER_BEARER_TOKEN,
      },
    }
  ).then((response) => {
    return Promise.resolve(response.body)
  })

  const rawImageURL = JSON.parse(res).data.profile_image_url
  const imageURL = rawImageURL.replace(/_(?:bigger|mini|normal)\./, `_400x400.`)
  const { body: imgBody } = await got(imageURL, { responseType: 'buffer' })

  return imgBody
}
