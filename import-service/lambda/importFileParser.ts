import { S3Handler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as csv from 'csv-parser';

const s3 = new AWS.S3({ region: process.env.AWS_REGION || "eu-north-1" });
const sqs = new AWS.SQS({ region: process.env.AWS_REGION || "eu-north-1" });
const queueUrl = process.env.SQS_QUEUE_URL!;

export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    console.log('record', record);
    const params = {
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key,
    };

    const s3Stream = s3.getObject(params).createReadStream();

    await new Promise<void>((resolve, reject) => {
      s3Stream.pipe(csv())
        .on('data', async (data) => {
          const messageParams = {
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(data),
          };
  
          try {
            await sqs.sendMessage(messageParams).promise();
            console.log('Message sent to SQS:', data);
          } catch (error) {
            console.error('Error sending message to SQS:', error);
          }
        })
        .on('error', (error) => {
          console.error('Error:', error);
          reject(error);
        })
        .on('end', () => {
          console.log('Parsing finished.');
          resolve();
        });
    });

    const newKey = record.s3.object.key.replace('uploaded/', 'parsed/');

    await s3.copyObject({
      Bucket: record.s3.bucket.name,
      CopySource:`${record.s3.bucket.name}/${record.s3.object.key}`,
      Key: newKey,
    }).promise();

    await s3.deleteObject(params).promise();
  }
};
