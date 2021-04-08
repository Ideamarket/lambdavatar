import axios from 'axios'
import * as cheerio from 'cheerio'

export default async function run(username: string): Promise<any> {
  const res = await axios.get(`https://${username}.substack.com`)
  const $ = cheerio.load(res.data)
  const imageURL = $('link[rel=apple-touch-icon][sizes=120x120]').attr('href')
  const image = await axios.get(imageURL, { responseType: 'arraybuffer' })
  return image.data
}
