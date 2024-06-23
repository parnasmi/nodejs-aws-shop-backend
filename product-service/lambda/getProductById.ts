// lambda/getProductById.ts
import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME!;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const productId = event.pathParameters?.id;

  if (!productId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Product ID is required' }),
    };
  }

  try {
    const productData = await dynamoDb.get({ TableName: PRODUCTS_TABLE_NAME, Key: { id: productId } }).promise();
    const stockData = await dynamoDb.get({ TableName: STOCKS_TABLE_NAME, Key: { product_id: productId } }).promise();

    if (!productData.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    const product = productData.Item;
    const stock = stockData.Item || { count: 0 };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, count: stock.count }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Error retrieving product' }),
    };
  }
};

