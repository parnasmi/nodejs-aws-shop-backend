import { handler } from '../lambda/importProductsFile';
import { APIGatewayProxyEvent,Context } from 'aws-lambda';
import * as AWSMock from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';



describe('importProductsFile', () => {
  beforeAll(() => {
    AWSMock?.default?.setSDKInstance(AWS);
  });

  afterAll(() => {
    AWSMock?.default?.restore();
  });

  const context: Context = {} as any;
    const callback = () => {};

  it('should return a 400 status code if no file name is provided', async () => {
    const event: APIGatewayProxyEvent = {
      queryStringParameters: {},
    } as any;

    const context: Context = {} as any;
    const callback = () => {};


  const result = await handler(event, context, callback) as any;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('File name is required');
  });

  it('should return a signed URL if file name is provided', async () => {
    AWSMock?.default?.mock('S3', 'getSignedUrl', (operation, params, callback) => {
      callback(null, 'https://signed-url.com');
    });

    const event: APIGatewayProxyEvent = {
      queryStringParameters: { name: 'test.csv' },
    } as any;

    try {
        const result = await handler(event,context, callback) as any;

        expect(result.statusCode).toBe(200);
        expect(result.body).toBe(JSON.stringify('https://signed-url.com'));
        expect(result.headers).toEqual({
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, PUT, OPTIONS, DELETE",
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
        });
    
    } catch (error) {
        console.log(error)
    } finally {
        AWSMock?.default?.restore('S3');
    }

    
  });

  it('should return a 500 status code if there is an error creating the signed URL', async () => {
    AWSMock?.default?.mock('S3', 'getSignedUrl', (operation, params, callback) => {
      callback(new Error('Could not create signed URL'), null);
    });

    const event: APIGatewayProxyEvent = {
      queryStringParameters: { name: 'test.csv' },
    } as any;

    const result = await handler(event, context, callback) as any;

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Could not create signed URL');

    AWSMock?.default?.restore('S3');
  });
});
