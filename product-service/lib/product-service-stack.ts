import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import * as iam from "aws-cdk-lib/aws-iam";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB tables
    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName:'products',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: {name: 'title', type: dynamodb.AttributeType.STRING},
      billingMode:dynamodb.BillingMode.PROVISIONED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stocksTable = new dynamodb.Table(this, 'StocksTable', {
      tableName:'stocks',
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PROVISIONED,
    });

    //Create execution role for permissions
    const dynamoRolePolicy = new iam.PolicyStatement({
      actions: [
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
      ],
      resources: [productsTable.tableArn, stocksTable.tableArn],
    });

    // Create the Lambda functions
    const getProductsListLambda = new lambda.Function(this, 'GetProductsListHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda')),
      handler: 'getProductsList.handler',
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    getProductsListLambda.addToRolePolicy(dynamoRolePolicy);

    const getProductByIdLambda = new lambda.Function(this, 'GetProductByIdHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'getProductById.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    getProductByIdLambda.addToRolePolicy(dynamoRolePolicy);

    const createProductLambda = new lambda.Function(
      this,
      "CreateProductHandler",
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "createProduct.handler",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCKS_TABLE_NAME: stocksTable.tableName,
        },
      },
    );
    createProductLambda.addToRolePolicy(dynamoRolePolicy);

    // Grant permissions to Lambda functions
    productsTable.grantReadData(getProductsListLambda);
    stocksTable.grantReadData(getProductsListLambda);
    productsTable.grantReadData(getProductByIdLambda);
    stocksTable.grantReadData(getProductByIdLambda);

    // Create the API Gateway
    const api = new apigateway.RestApi(this, 'ProductsServiceApi', {
      restApiName: 'Product Service',
      description: 'This service serves products.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create /products resource
    const products = api.root.addResource('products');

    
    // Add GET /products
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));
    
    // Create /products/{id} resource
    const product = products.addResource('{id}');

    // Add GET /products/{id}
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductByIdLambda));

    //Add PUT /products
    products.addMethod( 'PUT', new apigateway.LambdaIntegration(createProductLambda));
  }
}
