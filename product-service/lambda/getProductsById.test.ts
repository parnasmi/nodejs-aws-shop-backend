import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { handler as getProductsById } from './getProductById';
import { getProductById } from './products';

// Mock data
const mockProduct = { id: '1', name: 'Product 1', price: 100 };

// Mock the getProductById function
jest.mock('./products', () => ({
  getProductById: jest.fn(),
}));

// Define a mock context
const mockContext = {} as Context;

// Mock callback function
const mockCallback = jest.fn();

describe('getProductsById', () => {
  beforeEach(() => {
    (getProductById as jest.Mock).mockReturnValue(mockProduct);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a product when found', async () => {
    const mockEvent = { pathParameters: { id: '1' } } as unknown as APIGatewayProxyEvent;
    const result = await getProductsById(mockEvent, mockContext, mockCallback) as APIGatewayProxyResult;

    expect(result).not.toBeUndefined();
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toHaveProperty('id', '1');
  });

  it('returns 404 when product is not found', async () => {
    (getProductById as jest.Mock).mockReturnValue(null);
    const mockEvent = { pathParameters: { id: 'nonexistent' } } as unknown as APIGatewayProxyEvent;
    const result = await getProductsById(mockEvent, mockContext, mockCallback) as APIGatewayProxyResult;

    expect(result).not.toBeUndefined();
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({ message: 'Product not found' });
  });
});
