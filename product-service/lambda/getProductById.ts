import { APIGatewayProxyHandler } from "aws-lambda";
import { HEADERS, getProductById } from "./products";

export const handler: APIGatewayProxyHandler = async (event) => {

    const productId = event.pathParameters?.id;
    const product = getProductById(productId);

    if (!productId) {
        return {
          statusCode: 400,
          headers: HEADERS,
          body: JSON.stringify({ message: "Product id is required" }),
        };
      }

    if(!product) {
        return {
            statusCode: 404,
            headers: HEADERS,
            body: JSON.stringify({message: 'Product not found'})
        }
    }

    return {
        statusCode: 200,
        headers:HEADERS,
        body: JSON.stringify(product)
    }
}