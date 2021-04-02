import { Handler } from 'aws-lambda';
import axios from 'axios';
import { S3, Endpoint } from 'aws-sdk';
import * as cheerio from 'cheerio';
import { smallerImage } from '../helpers/helpers';


const substack: Handler = async (event: any, context, callback: () => void) => {

  const s3 = new S3({
    s3ForcePathStyle: true,
    endpoint: new Endpoint('http://localhost:8000'),
    accessKeyId: 'S3RVER',
    secretAccessKey: 'S3RVER',
  });

  if (!event?.pathParameters?.id) {
    return ({ statusCode: 400, statusText: 'No id provided' })
  }

  try {
    let s3Image = await s3.getObject({ Bucket: 'local-bucket', Key: `substack/${event.pathParameters.id}` }).promise();
    let object = JSON.parse(s3Image?.Body?.toString('utf-8'));

    if (object?.lastUpdated && (Date.now() - parseInt(object.lastUpdated)) < parseInt(process.env.checkByDate)) {
      if (object?.url && typeof object.url === 'string' && object.url.length > 11) {
        return {
          statusCode: 200,
          body: JSON.stringify(
            {
              image: object.url
            },
            null,
            2
          ),
        };
      }
    }
  }
  catch (err) {
    console.log(err)
  }

  let res = await axios.get(`https://${event.pathParameters.id}.substack.com`)
  const $ = cheerio.load(res.data)
  const profileUrl = $('link[rel=apple-touch-icon][sizes=120x120]').attr('href')

  res = await axios.get(profileUrl, { responseType: 'arraybuffer' });
  const dataUrl = await smallerImage(Buffer.from(res.data));

  const s3Params = {
    Bucket: 'local-bucket',
    Key: `substack/${event.pathParameters.id}`,
    Body: JSON.stringify({
      url: dataUrl,
      lastUpdated: Date.now()
    }),
    ContentType: 'application/json'
  };

  s3.putObject(s3Params).promise();
 
  const response = {
    statusCode: 200,
    body: JSON.stringify(
      {
        image: dataUrl,
      },
      null,
      2
    ),
  };

  return response;
}

export default substack;