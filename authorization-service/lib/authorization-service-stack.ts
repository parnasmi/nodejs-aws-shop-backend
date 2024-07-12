import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the Lambda function
    const basicAuthorizer = new lambda.Function(this, 'BasicAuthorizer', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'basicAuthorizer.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambdas')),
      environment: {
        parnasmi: process.env.parnasmi!,
      },
    });

    // Add necessary permissions
    basicAuthorizer.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: ['*'],
    }));

    // Grant API Gateway permission to invoke the Lambda function
    const apiGatewayPrincipal = new iam.ServicePrincipal('apigateway.amazonaws.com');
    basicAuthorizer.addPermission('ApiGatewayInvoke', {
      principal: apiGatewayPrincipal,
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:*`,
    });


    new cdk.CfnOutput(this, 'BasicAuthorizerArn', {
      value: basicAuthorizer.functionArn,
      exportName: 'BasicAuthorizerArn'
    });
  }
}
