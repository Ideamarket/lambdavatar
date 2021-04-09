import got from 'got'
import * as cheerio from 'cheerio'

export default async function run(username: string): Promise<any> {
  const { body } = await got(`https://tryshowtime.com/${username}`)
  const $ = cheerio.load(body)
  const res = JSON.parse($('script[id="__NEXT_DATA__"]').html() as string)
  if (
    !res ||
    !res.props ||
    !res.props.pageProps ||
    !res.props.pageProps.img_url
  ) {
    throw new Error('not found')
  }

  const imageURL = res.props.pageProps.img_url
  const { body: imgBody } = await got(imageURL as string, {
    responseType: 'buffer',
  })
  return imgBody
}
