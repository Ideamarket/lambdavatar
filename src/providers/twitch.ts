import got from 'got'
import * as cheerio from 'cheerio'

export default async function run(username: string): Promise<any> {
  const { body } = await got(`https://twitch.tv/${username}`)
  const $ = cheerio.load(body)
  const imageURL = $('meta[property="og:image"]').attr('content')
  const { body: imgBody } = await got(imageURL as string, {
    responseType: 'buffer',
  })
  return imgBody
}
