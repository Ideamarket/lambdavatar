import { Handler } from 'aws-lambda';
import axios from 'axios';
import { S3, Endpoint } from 'aws-sdk';
import { smallerImage } from '../helpers/helpers';

const twitter: Handler = async (event: any) => {

  const s3 = new S3({
    s3ForcePathStyle: true,
    endpoint: new Endpoint(process.env.s3Endpoint),
    accessKeyId: process.env.s3AccessKey,
    secretAccessKey: process.env.s3SecretAccessKey,
  });

  if (!event?.pathParameters?.id) {
    return ({ statusCode: 400, statusText: 'No id provided' })
  }

  try {
    let s3Image = await s3.getObject({ Bucket: process.env.s3Bucket, Key: `twitter/${event.pathParameters.id}` }).promise();
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
  }

  let params = {
    usernames: event.pathParameters.id,
    "user.fields": "profile_image_url"
  }

  let headers = {
    "authorization": `BEARER ${process.env.twitterBearerToken}`
  }
  let res = await axios.get('https://api.twitter.com/2/users/by', { params, headers });

  if (res.data?.errors?.length > 0){
    return ({ statusCode: 400, statusText: res.data.errors[0].details })
  }
  let profileUrl = res.data.data[0].profile_image_url;

  res = await axios.get(profileUrl, { responseType: 'arraybuffer' });
  let imageData = Buffer.from(res.data);
  const dataUrl = await smallerImage(imageData);

  const s3Params = {
    Bucket: process.env.s3Bucket,
    Key: `twitter/${event.pathParameters.id}`,
    Body: JSON.stringify({
      url: dataUrl,
      lastUpdated: Date.now()
    }),
    ContentType: 'application/json'
  };

  let putRes = await s3.putObject(s3Params).promise();
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

export default twitter;