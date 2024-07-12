import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as path from 'path';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket
    const bucket: cdk.aws_s3.IBucket = s3.Bucket.fromBucketName(
      this,
      "ImportServiceS3Bucket",
      "my-import-bucket-uz",
    );

    // Reference the SQS queue created in ProductServiceStack
    const queue = sqs.Queue.fromQueueArn(this, 'CatalogItemsQueue', cdk.Fn.importValue('CatalogItemsQueueService'));

    // Create the Lambda function
    const importProductsFileLambda = new lambda.Function(this, 'ImportProductsFileLambda', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'importProductsFile.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });
    //TODO: remove commented code
    // // Reference the authorization Lambda function
    // const authorizerLambda = lambda.Function.fromFunctionArn(
    //   this,
    //   'BasicAuthorizer',
    //   'arn:aws:lambda:eu-north-1:905418264985:function:AuthorizationServiceStack-BasicAuthorizer2B49C1FC-b16aBiCGxE5w'
    // );

    // // Create Lambda authorizer
    // const authorizer = new apigateway.TokenAuthorizer(this, 'Authorizer', {
    //   handler: authorizerLambda,
    // });

    

    // Grant the Lambda function permissions to interact with the S3 bucket
    bucket.grantReadWrite(importProductsFileLambda);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'ImportServiceApi', {
      restApiName: 'Import Service',
      description: 'This service imports products.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Authorization',
          'Content-Type',
          'X-Amz-Date',
          'X-Amz-Security-Token',
          'X-Api-Key',
        ],
      }
    });
    
    // Reference the authorization Lambda function
    const basicAuthorizerArn = cdk.Fn.importValue('BasicAuthorizerArn');
    
    // Create Lambda authorizer
    const authorizer = new apigateway.CfnAuthorizer(this, 'BasicAuthorizer', {
      restApiId: api.restApiId,
      name: 'BasicAuthorizer',
      type: 'TOKEN',
      authorizerUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${basicAuthorizerArn}/invocations`,
      identitySource: 'method.request.header.Authorization',
    });

    // Create /import resource
    const importResource = api.root.addResource('import');
   
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileLambda), {
      requestParameters: {
        'method.request.querystring.name': true,
      },
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      authorizer: { authorizerId: authorizer.ref },
    });

    // Add necessary policies to the Lambda function
    importProductsFileLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [bucket.bucketArn + '/*'],
    }));


    // Create the importFileParser Lambda function
    const importFileParserLambda = new lambda.Function(this, 'ImportFileParserLambda', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'importFileParser.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        SQS_QUEUE_URL: queue.queueUrl,
      },
    });

    // Grant the Lambda function permissions to read from the S3 bucket
    bucket.grantReadWrite(importFileParserLambda);

     // Grant permissions to send messages to the SQS queue
    queue.grantSendMessages(importFileParserLambda);

    // Add S3 event notification to trigger the Lambda function
    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParserLambda), {
      prefix: 'uploaded/',
    });
  }
}
