import { Handler } from 'aws-lambda';
import axios from 'axios';
import { S3, Endpoint } from 'aws-sdk';
import * as sharp from 'sharp';
const cheerio = require('cheerio');

export const twitter: Handler = async (event: any, context, callback: () => void) => {
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
    let s3Image = await s3.getObject({ Bucket: 'local-bucket', Key: `twitter/${event.pathParameters.id}` }).promise();
    let object = JSON.parse(s3Image?.Body?.toString('utf-8'));
    console.log('been this long', Date.now() - parseInt(object.lastUpdated));
    if (object?.lastUpdated && (Date.now() - parseInt(object.lastUpdated)) < parseInt(process.env.checkByDate)) {
      console.log('grabbing from S3')
      if (object?.url) {
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

  let params = {
    usernames: event.pathParameters.id,
    "user.fields": "profile_image_url"
  }

  let headers = {
    "authorization": `BEARER ${process.env.TWITTER_BEARER_TOKEN}`
  }
  let res = await axios.get('https://api.twitter.com/2/users/by', { params, headers });
  let profileUrl = res.data.data[0].profile_image_url;

  res = await axios.get(profileUrl, { responseType: 'arraybuffer' });
  let imageData = Buffer.from(res.data);
  const dataUrl = smallerImage(imageData);

  const s3Params = {
    Bucket: 'local-bucket',
    Key: `twitter/${event.pathParameters.id}`,
    Body: JSON.stringify({
      url: dataUrl,
      lastUpdated: Date.now()
    }),
    ContentType: 'application/json'
  };

  let putRes = s3.putObject(s3Params).promise();
  console.log(putRes);

  const response = {
    statusCode: 200,
    body: JSON.stringify(
      {
        image: dataUrl
      },
      null,
      2
    ),
  };

  return response;
}

export const substack: Handler = async (event: any, context, callback: () => void) => {

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
      console.log('grabbing from S3')
      if (object?.url) {
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

  let putRes = s3.putObject(s3Params).promise();
  console.log(putRes);
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

const smallerImage = async (imageData: Buffer): Promise<string> => {
  let smallImage = await sharp(imageData).resize({width: parseInt(process.env.imageWidth)}).png().toBuffer();
  let dataUrl = `data:image/png;base64,${smallImage.toString('base64')}`;
  return dataUrl;
}