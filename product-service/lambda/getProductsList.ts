import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
import { HEADERS, getAllProducts } from "./products";

export const handler: APIGatewayProxyHandler = async (event) => {
    const products = getAllProducts();

    if(!products.length) {
      return {
        statusCode: 404,
        headers: HEADERS,
        body: JSON.stringify({message: 'Products not found'})
      }
    }
  
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify(products),
    };
  };