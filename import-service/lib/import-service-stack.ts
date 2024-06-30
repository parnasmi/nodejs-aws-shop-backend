import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as path from 'path';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
    // const bucket = new s3.Bucket(this, 'ImportBucket', {
    //   bucketName: 'my-import-bucket-uz',
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    //   autoDeleteObjects: true,
    // });
    // Create S3 bucket
    const bucket: cdk.aws_s3.IBucket = s3.Bucket.fromBucketName(
      this,
      "ImportServiceS3Bucket",
      "my-import-bucket-uz",
    );

    // Create the Lambda function
    const importProductsFileLambda = new lambda.Function(this, 'ImportProductsFileLambda', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'importProductsFile.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // Grant the Lambda function permissions to interact with the S3 bucket
    bucket.grantReadWrite(importProductsFileLambda);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'ImportServiceApi', {
      restApiName: 'Import Service',
      description: 'This service imports products.',
    });

    // Create /import resource
    const importResource = api.root.addResource('import');
    // importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileLambda, {
    //   requestParameters: {
    //     'method.request.querystring.name': 'true',
    //   },
    // }));
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileLambda), {
      requestParameters: {
        'method.request.querystring.name': true,
      },
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
    });

    // Grant the Lambda function permissions to read from the S3 bucket
    bucket.grantRead(importFileParserLambda);

    // Add S3 event notification to trigger the Lambda function
    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParserLambda), {
      prefix: 'uploaded/',
    });
  }
}
