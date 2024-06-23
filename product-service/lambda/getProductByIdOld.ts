// lambda/getProductById.ts
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME!;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME!;

const getProductById = async (id: string) => {
  const command = new GetCommand({
    TableName: PRODUCTS_TABLE_NAME,
    Key: { id },
  });
  const response = await docClient.send(command);
  return response.Item;
};

const getStockById = async (id: string) => {
  const command = new GetCommand({
    TableName: STOCKS_TABLE_NAME,
    Key: { product_id: id },
  });
  const response = await docClient.send(command);
  return response.Item;
};

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log("EVENT object:", JSON.stringify(event, null, 2));

  const id = event.pathParameters?.id || "";

  try {
    console.log(`Fetching product with id: ${id}`);
    const product = await getProductById(id);
    console.log('Product data:', product);

    console.log(`Fetching stock data for product id: ${id}`);
    const stockData = await getStockById(id);
    console.log('Stock data:', stockData);

    if (!product) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    const combinedData = { ...product, count: stockData?.count || 0 };
    console.log('Combined data:', combinedData);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(combinedData),
    };

  } catch (error) {
    console.error('Error fetching product data:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: 'Error retrieving product', error }),
    };
  }
};