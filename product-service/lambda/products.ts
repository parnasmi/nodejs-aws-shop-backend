import { IProduct, Stock } from "./products.types";

export const products:IProduct[] = [
    { id: '1', title: 'Product 1', price: 100, description: 'Some description 1' },
    { id: '2', title: 'Product 2', price: 200, description: 'Some description 2' },
    { id: '3', title: 'Product 3', price: 300, description: 'Some description 3' },
  ];

  export const stocks:Stock[] = [
    { count: 10 },
    { count: 20 },
    { count: 30 },
  ];
  

export const HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    "Access-Control-Allow-Credentials": "true"
}

export const getAllProducts = () => products;

export const getProductById = (id?: string) => products.find(p => p.id === id);