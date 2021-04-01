import { Handler } from 'aws-lambda';
import axios from 'axios';
const cheerio = require('cheerio');

export const twitter: Handler = async (event: any, context, callback: () => void) => {

  let params = {
    usernames: event.pathParameters.id,
    "user.fields": "profile_image_url"
  }

  let headers = {
    "authorization": `BEARER ${process.env.TWITTER_BEARER_TOKEN}`
  }
  let res = await axios.get('https://api.twitter.com/2/users/by', { params, headers});
  let profileUrl = res.data.data[0].profile_image_url;
  res = await axios.get(profileUrl, { responseType: 'arraybuffer'});
  let dataUrl = Buffer.from(res.data).toString('base64');

  const response = {
    statusCode: 200,
    body: JSON.stringify(
      {
        image: `data:image/png;base64,${dataUrl}`
      },
      null,
      2
    ),
  };

  return new Promise((resolve) => {
    resolve(response)
  })
}

export const substack: Handler = async (event: any, context, callback: () => void) => {
  let res = await axios.get(`https://${event.pathParameters.id}.substack.com`)
  const $ = cheerio.load(res.data)
  const profileUrl = $('link[rel=apple-touch-icon][sizes=120x120]').attr('href')

  res = await axios.get(profileUrl, { responseType: 'arraybuffer'});
  let dataUrl = Buffer.from(res.data).toString('base64');

  const response = {
    statusCode: 200,
    body: JSON.stringify(
      {
        image: `data:image/png;base64,${dataUrl}`,
      },
      null,
      2
    ),
  };

  return new Promise((resolve) => {
    resolve(response)
  })
}