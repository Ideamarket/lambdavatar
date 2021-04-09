import got from 'got'
import * as cheerio from 'cheerio'

export default async function run(username: string): Promise<any> {
  const { body } = await got(`https://${username}.substack.com`)
  const $ = cheerio.load(body)
  const imageURL = $('link[rel=apple-touch-icon][sizes=120x120]').attr('href')
  const { body: imgBody } = await got(imageURL, { responseType: 'buffer' })
  return imgBody
}
