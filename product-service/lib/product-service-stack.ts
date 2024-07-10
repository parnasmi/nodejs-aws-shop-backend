import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the SNS topic
    const createProductTopic = new sns.Topic(this, 'CreateProductTopic');

    // Email subscription for all messages
    createProductTopic.addSubscription(new subs.EmailSubscription('i-parnas@yandex.com'));

    // Email subscription with filter policy for price > 100
    createProductTopic.addSubscription(new subs.EmailSubscription('parnas-mi@yandex.com', {
      filterPolicy: {
        price: sns.SubscriptionFilter.numericFilter({
          greaterThan: 100,
        }),
      },
    }));


    // Create DynamoDB tables
    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName:'products',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode:dynamodb.BillingMode.PROVISIONED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stocksTable = new dynamodb.Table(this, 'StocksTable', {
      tableName:'stocks',
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PROVISIONED,
    });

    // Define the SQS queue
    const queue = new sqs.Queue(this, 'CatalogItemsQueue', {
      queueName: 'CatalogItemsQueueService',
      visibilityTimeout: cdk.Duration.seconds(30),
      receiveMessageWaitTime: cdk.Duration.seconds(20),
    });

    new cdk.CfnOutput(this, "CatalogItemsQueueUrl", {
      value: queue.queueArn,
      exportName: "CatalogItemsQueueService",
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
        code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda')),
        handler: "createProduct.handler",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCKS_TABLE_NAME: stocksTable.tableName,
        },
      },
    );
    createProductLambda.addToRolePolicy(dynamoRolePolicy);

    
    const catalogBatchProcessLambda = new lambda.Function(this, 'CatalogBatchProcessFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'catalogBatchProcess.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        SNS_TOPIC_ARN: createProductTopic.topicArn,
      },
    });

    catalogBatchProcessLambda.addToRolePolicy(dynamoRolePolicy);
    
    // Grant permissions to Lambda functions
    productsTable.grantReadData(getProductsListLambda);
    stocksTable.grantReadData(getProductsListLambda);
    productsTable.grantReadData(getProductByIdLambda);
    stocksTable.grantReadData(getProductByIdLambda);
    productsTable.grantReadWriteData(createProductLambda);
    stocksTable.grantReadWriteData(createProductLambda);
    productsTable.grantWriteData(catalogBatchProcessLambda);

     // Grant the Lambda function permissions to interact with SQS
     queue.grantConsumeMessages(catalogBatchProcessLambda);
     createProductTopic.grantPublish(catalogBatchProcessLambda);

    // Create the API Gateway
    const api = new apigateway.RestApi(this, 'ProductsServiceApi', {
      restApiName: 'Product Service',
      description: 'This service serves products.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS
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

    //Add POST /products
    products.addMethod('POST', new apigateway.LambdaIntegration(createProductLambda));

    // Add the SQS event source to the Lambda function
    catalogBatchProcessLambda.addEventSource(
      new SqsEventSource(queue, {
        batchSize: 5,
      })
    );
  }
}
