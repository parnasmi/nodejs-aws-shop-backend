import * as AWS from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { IProduct } from "./products.types";
import { randomUUID } from "crypto";
import { HEADERS } from "./products";

const dynamodb = new AWS.DynamoDB.DocumentClient();

const productsTableName = process.env.PRODUCTS_TABLE_NAME || "products";
const stocksTableName = process.env.STOCKS_TABLE_NAME || "stocks";

type ProductPayload = Omit<IProduct,'id'> & {count:string};

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}") as ProductPayload;
    const id = randomUUID();
    const { title, description, price, count } = body;

    console.log("Event: ", JSON.stringify(event));

    if (!event.body) {
      return {
        statusCode:400,
        headers: HEADERS,
        body: JSON.stringify('Invalid request'),
      }
    }

    const productParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: productsTableName,
      Item: { id, title, description, price },
    };

    const stockParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: stocksTableName,
      Item: { product_id: id, count },
    };

    await dynamodb.put(productParams).promise();
    await dynamodb.put(stockParams).promise();

    return {
      statusCode: 201,
      headers: HEADERS,
      body: JSON.stringify({ message: "Product created successfully" }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ message: error.message }),
    };
  }
};