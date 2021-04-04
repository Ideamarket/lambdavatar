import { Handler } from 'aws-lambda';
import axios from 'axios';
import { S3, Endpoint } from 'aws-sdk';
import * as cheerio from 'cheerio';
import { getUrlFromS3, putImageOnS3 } from '../helpers/helpers';


const substack: Handler = async (event: any, context, callback: () => void) => {

  const s3 = process.env.IS_OFFLINE ? new S3({
    s3ForcePathStyle: true,
    endpoint: new Endpoint(process.env.s3Endpoint),
    accessKeyId: process.env.s3AccessKey,
    secretAccessKey: process.env.s3SecretAccessKey,
  }) :
    new S3();

  if (!event?.pathParameters?.id) {
    return ({ statusCode: 400, statusText: 'No id provided' })
  }

  const imageUrl = await getUrlFromS3(s3, `substack/${event.pathParameters.id}`)
  if (imageUrl) {
    const response = {
      statusCode: 200,
      body: imageUrl,
    };
    return response;
  }


  const res = await axios.get(`https://${event.pathParameters.id}.substack.com`)
  const $ = cheerio.load(res.data)
  const profileUrl = $('link[rel=apple-touch-icon][sizes=120x120]').attr('href')

  const s3Url = await putImageOnS3(s3, `substack/${event.pathParameters.id}`, profileUrl);
 
  const response = {
    statusCode: 200,
    body: s3Url
  };

  return response;
}

export default substack;