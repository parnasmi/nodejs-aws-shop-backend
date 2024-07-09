import { SQSHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const product = JSON.parse(record.body);
    const params = {
      TableName: process.env.PRODUCTS_TABLE_NAME!,
      Item: product,
    };

    try {
      await dynamoDB.put(params).promise();
      console.log(`Product ${product.id} added successfully.`);
    } catch (error) {
      console.error(`Error adding product ${product.id}:`, error);
    }
  }
};
