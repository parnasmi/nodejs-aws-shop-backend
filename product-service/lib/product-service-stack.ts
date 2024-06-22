import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the Lambda functions
    const getProductsListLambda = new lambda.Function(this, 'GetProductsListHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getProductsList.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda'))
    });

    const getProductByIdLambda = new lambda.Function(this, 'GetProductByIdHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getProductById.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda'))
    });

    //Create the API Gateway
    const api = new apigateway.RestApi(this, 'ProductsServiceApi', {
      restApiName: 'Product Service',
      description: 'The current service serves products.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create /products resource
    const products = api.root.addResource('products');

    //Add GET /products
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));

    //Create /products/{id} resource
    const product = products.addResource('{id}');

    // Add GET /products/{id}
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductByIdLambda));

  }
}
