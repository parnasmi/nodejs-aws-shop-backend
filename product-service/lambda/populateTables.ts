import * as AWS from "aws-sdk";
import { products, stocks } from "./products";
import {v4 as uuidv4} from 'uuid';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE_NAME: string = process.env.PRODUCTS_TABLE_NAME!;
const STOCKS_TABLE_NAME: string = process.env.STOCKS_TABLE_NAME!;

export const handler = async ():Promise<void> => {

    for (let i = 0; i < products.length; i++) {
        const id = uuidv4();
        const product = {  ...products[i],id};
        const stock = { product_id: id, ...stocks[i] };

        try {
            await dynamoDb.put({ TableName: PRODUCTS_TABLE_NAME, Item: product }).promise();
            await dynamoDb.put({ TableName: STOCKS_TABLE_NAME, Item: stock }).promise();
            console.log(`Added product and stock with id: ${id}`);
        } catch (err) {
            console.error(`Failed to add product and stock with id: ${id}`, err);
        }
    }
}