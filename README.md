# Avatar Star

A simple AWS lambda function built with [Serverless SDK](https://serverless.com) that pulls a user's avatar from twitter or substack and returns it as a dataURL.  

## Setup

- Clone the repo
- Copy the `env.example.json`, add your Twitter Bearer Token, and rename to `env.offline.json`
    - Configure any port/server settings as desired
- Copy `env.example.json` to `env.dev.json` and add your Twitter Bearer Token

## Configuration

In `serverless.yml`
- `provider:environment:checkByDate` - Time in milliseconds until an avatar should be updated again
- `provider.environment:imageWidth`  - Pixel width of avatar to be served
## Usage

A successful response for either `/twitter` or `/substack` will return a URL to the file stored on S3 in a resopnse of the sort:
```json
{
    "url:"s3.amazonaws.com/avatar-star.twitter/..."
}
```
- For local testing
    - Run `npm run local-server`
    - Access localhost:3000/twitter/{id} where {id} is any twitter ID or localhost:3000/substack/{id} where {id} is any substack ID
- To deploy to AWS
    - Run `npm run deploy`
