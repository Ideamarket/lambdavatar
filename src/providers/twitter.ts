import axios from 'axios'

export default async function run(username: string) {
  const params = {
    usernames: username,
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
  const image = await axios.get(profileUrl, { responseType: 'arraybuffer' })
  return image.data
}
