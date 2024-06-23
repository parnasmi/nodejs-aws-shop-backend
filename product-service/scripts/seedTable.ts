import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { products } from "../dist/lambda/products";

const client = new DynamoDBClient({ region: "eu-north-1" });

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

const populateProducts = async (): Promise<Product[]> => {

  const productItems: Product[] = [];

  for (const product of products) {
    const id = uuidv4();
    const params = {
      TableName: "products",
      Item: {
        id: { S: id },
        title: { S: product.title },
        description: { S: product.description },
        price: { N: product.price.toString() },
      },
    };

    try {
      const data = await client.send(new PutItemCommand(params));
      console.log("Product added successfully", data);
      productItems.push({  ...product, id });
    } catch (err) {
      console.error("Error adding product", err);
    }
  }

  return productItems;
};

const populateStocks = async (products: Product[]) => {
  const stocks = [
    { count: 10 },
    { count: 20 },
    { count: 30 },
  ];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const stock = stocks[i];

    const params = {
      TableName: "stocks",
      Item: {
        product_id: { S: product.id },
        count: { N: stock.count.toString() },
      },
    };

    try {
      const data = await client.send(new PutItemCommand(params));
      console.log("Stock added successfully", data);
    } catch (err) {
      console.error("Error adding stock", err);
    }
  }
};

const main = async () => {
  const products = await populateProducts();
  await populateStocks(products);
};

main();


// import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
// import { v4 as uuidv4 } from "uuid";

// const client = new DynamoDBClient({ region: "eu-north-1" });


// const populateProducts = async () => {
//   const products = [
//     { title: "Product 1", description: "Description for Product 1", price: 100 },
//     { title: "Product 2", description: "Description for Product 2", price: 200 },
//     { title: "Product 3", description: "Description for Product 3", price: 300 },
//   ];


//   for (const product of products) {
//     const params = {
//       TableName: 'products',
//       Item: {
//         id: { S: uuidv4() },
//         title: { S: product.title },
//         description: { S: product.description },
//         price: { N: product.price.toString() },
//       },
//     };

//     try {
//       const data = await client.send(new PutItemCommand(params));
//       console.log("Product added successfully", data);
//     } catch (err) {
//       console.error("Error adding product", err);
//     }
//   }
// };

// const populateStocks = async () => {
//   const stocks = [
//     { product_id: uuidv4(), count: 10 },
//     { product_id: uuidv4(), count: 20 },
//     { product_id: uuidv4(), count: 30 },
//   ];


//   for (const stock of stocks) {
//     const params = {
//       TableName: 'stocks',
//       Item: {
//         product_id: { S: stock.product_id },
//         count: { N: stock.count.toString() },
//       },
//     };

//     try {
//       const data = await client.send(new PutItemCommand(params));
//       console.log("Stock added successfully", data);
//     } catch (err) {
//       console.error("Error adding stock", err);
//     }
//   }
// };

// const main = async () => {
//   await populateProducts();
//   await populateStocks();
// };

// main();


// import * as AWS from "aws-sdk";
// import { products, stocks } from "../lambda/products";
// import {v4 as uuidv4} from 'uuid';

// require('aws-sdk/lib/maintenance_mode_message').suppress = true;

// const dynamoDb = new AWS.DynamoDB.DocumentClient();
// const PRODUCTS_TABLE_NAME: string = process.env.PRODUCTS_TABLE_NAME!;
// const STOCKS_TABLE_NAME: string = process.env.STOCKS_TABLE_NAME!;

// export const handler = async ():Promise<void> => {

//     for (let i = 0; i < products.length; i++) {
//         const id = uuidv4();
//         const product = {  ...products[i],id};
//         const stock = { product_id: id, ...stocks[i] };

//         try {
//             await dynamoDb.put({ TableName: PRODUCTS_TABLE_NAME, Item: product }).promise();
//             await dynamoDb.put({ TableName: STOCKS_TABLE_NAME, Item: stock }).promise();
//             console.log(`Added product and stock with id: ${id}`);
//         } catch (err) {
//             console.error(`Failed to add product and stock with id: ${id}`, err);
//         }
//     }
// }