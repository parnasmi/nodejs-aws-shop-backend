import { APIGatewayProxyHandler,APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
// import * as DynamoDB from 'aws-cdk-lib/aws-dynamodb';
import { HEADERS, getAllProducts } from "./products";
// import { DynamoDB } from 'aws-sdk';
import * as AWS from 'aws-sdk';
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME!;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event:APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const productsData = await dynamoDb.scan({TableName: PRODUCTS_TABLE_NAME}).promise();
      const stocksData = await dynamoDb.scan({TableName: STOCKS_TABLE_NAME}).promise();

      const products = productsData.Items || [];
      const stocks = stocksData.Items || [];

      const productsWithStocks = products.map(product => {
        const stock = stocks.find(s => s.product_id === product.id);
        return {
          ...product,
          count: stock ? stock.count : 0,
        };
      });

      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify(productsWithStocks),
      };

    } catch(error) {
      return {
        statusCode: 500,
        headers: HEADERS,
        body: JSON.stringify({ message: 'Error retrieving products' }),
      };
    }
  };

// import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
// import { HEADERS, getAllProducts } from "./products";

// export const handler: APIGatewayProxyHandler = async (event) => {
//     const products = getAllProducts();

//     if(!products.length) {
//       return {
//         statusCode: 404,
//         headers: HEADERS,
//         body: JSON.stringify({message: 'Products not found'})
//       }
//     }
  
//     return {
//       statusCode: 200,
//       headers: HEADERS,
//       body: JSON.stringify(products),
//     };
//   };