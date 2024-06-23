export type IProduct = {
    id: string;
    title: string;
    description: string;
    price: number;
  }

  export type Stock = {
    count:number
  }

  export type IProductNoId = Omit<IProduct, 'id'>;