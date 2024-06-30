// lambda/importFileParser.ts
import { S3Handler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as csv from 'csv-parser';

const s3 = new AWS.S3();

export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    const params = {
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key,
    };

    const s3Stream = s3.getObject(params).createReadStream();
    s3Stream.pipe(csv())
      .on('data', (data) => console.log('Parsed Data:', data))
      .on('error', (error) => console.error('Error:', error))
      .on('end', () => console.log('Parsing finished.'));
  }
};
