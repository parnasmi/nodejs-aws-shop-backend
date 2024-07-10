import { SQSHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS({ region: 'eu-north-1' });
const topicArn = process.env.SNS_TOPIC_ARN!;


export const handler: SQSHandler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2)); // Add this line
  for (const record of event.Records) {
    const product = JSON.parse(record.body);
    
    console.log('Processing product:', product); // Add this line

    const params = {
      TableName: process.env.PRODUCTS_TABLE_NAME!,
      Item: product,
    };

    try {
      await dynamoDB.put(params).promise();
      console.log(`Product ${product.id} added successfully.`);

      // Publish to SNS topic
      const snsParams = {
        Message: JSON.stringify(product),
        TopicArn: topicArn,
      };

      await sns.publish(snsParams).promise();
      console.log(`Product ${product.id} published to SNS topic.`);

    } catch (error) {
      console.error(`Error adding product ${product.id}:`, error);
    }
  }
};
