import { getAllProducts } from './products';
import { handler as getProductsList } from './getProductsList';
import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';

// Mock data
const mockProducts = [
    { id: '1', title: 'Product 1', price: 100 },
    { id: '2', title: 'Product 2', price: 200 },
  ];

  jest.mock('./products', () => ({
    getAllProducts: jest.fn()
  }));

  //Define a mock event
  const mockEvent = {} as APIGatewayProxyEvent;

  //Define a mock context
  const mockContext = {} as Context;

  // Mock callback function
  const mockCallback = jest.fn();

  describe('getProductsList', () => {
    beforeEach(() => {
        (getAllProducts as jest.Mock).mockReturnValue(mockProducts);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns a list of products', async () => {
        const result = await getProductsList(mockEvent, mockContext, mockCallback) as APIGatewayProxyResult;
        
        expect(result).not.toBeUndefined();
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual(expect.arrayContaining([expect.any(Object)]));
        expect(result.body).toEqual(JSON.stringify(mockProducts));
    });
  });