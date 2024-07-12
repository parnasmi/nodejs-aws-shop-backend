import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the Lambda function
    const basicAuthorizer = new lambda.Function(this, 'BasicAuthorizer', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'basicAuthorizer.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambdas')),
      environment: {
        parnasmi: 'TEST_PASSWORD',
      },
    });

    // Add necessary permissions
    basicAuthorizer.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: ['*'],
    }));

    // Expose basic authorization lambda Arn
    new cdk.CfnOutput(this, 'BasicAuthArnOutput', {
      value: basicAuthorizer.functionArn,
      exportName: 'basicAuthArn',
    })
  }
}
