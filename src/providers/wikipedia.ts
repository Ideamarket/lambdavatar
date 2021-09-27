import got from 'got'
import * as cheerio from 'cheerio'

export default async function run(username: string): Promise<any> {
  const { body } = await got(`https://en.wikipedia.org/wiki/${username}`)
  const $ = cheerio.load(body)
  let imageURL

  const primaryUrl = $('meta[property="og:image"]').attr('content')
  if (primaryUrl) {
    imageURL = primaryUrl
  } else {
    const secondaryUrl = $('td[class=infobox-image]').find('img').attr('src')
    imageURL = secondaryUrl?.startsWith('//')
      ? `https:${secondaryUrl}`
      : secondaryUrl
  }

  const { body: imgBody } = await got(imageURL as string, {
    responseType: 'buffer',
  })
  return imgBody
}
