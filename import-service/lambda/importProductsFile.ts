import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const s3 = new AWS.S3({ region: 'eu-north-1' });

export const handler: APIGatewayProxyHandler = async (event) => {
  const fileName = event.queryStringParameters?.name;

  if (!fileName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'File name is required' }),
    };
  }

  const params = {
    Bucket: process.env.BUCKET_NAME!,
    Key: `uploaded/${fileName}`,
    Expires: 3600, // URL expiration time in seconds
    ContentType: "text/csv",
  };

  try {
    const signedUrl = s3.getSignedUrl('putObject', params);
    return {
      statusCode: 200,
      body: JSON.stringify(signedUrl),
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS, DELETE",
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not create signed URL' }),
    };
  }
};
