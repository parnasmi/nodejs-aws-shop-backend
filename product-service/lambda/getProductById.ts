// lambda/getProductById.ts
import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { HEADERS } from './products';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME!;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const productId = event.pathParameters?.id;

 

  if (!productId) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ message: 'Product ID is required' }),
    };
  }
  //todo: remove logs
  console.log('PRODUCTS_TABLE_NAME',PRODUCTS_TABLE_NAME);
  console.log('STOCKS_TABLE_NAME',STOCKS_TABLE_NAME);
  console.log('productId',productId);
  try {
    const productData = await dynamoDb.get({ TableName: PRODUCTS_TABLE_NAME, Key: { id: productId } }).promise();
    const stockData = await dynamoDb.get({ TableName: STOCKS_TABLE_NAME, Key: { product_id: productId } }).promise();
    console.log('productData',productData);
    console.log('stockData',stockData);
    if (!productData.Item) {
      return {
        statusCode: 404,
        headers: HEADERS,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    const product = productData.Item;
    const stock = stockData.Item || { count: 0 };

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ ...product, count: stock.count }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ message: 'Error retrieving product' }),
    };
  }
};
