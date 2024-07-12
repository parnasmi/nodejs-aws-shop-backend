"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportServiceStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const s3 = require("aws-cdk-lib/aws-s3");
const iam = require("aws-cdk-lib/aws-iam");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const s3n = require("aws-cdk-lib/aws-s3-notifications");
const path = require("path");
const sqs = require("aws-cdk-lib/aws-sqs");
class ImportServiceStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create S3 bucket
        const bucket = s3.Bucket.fromBucketName(this, "ImportServiceS3Bucket", "my-import-bucket-uz");
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
        const basicAuthorizerArn = cdk.Fn.importValue('BasicAuthorizerArn');
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
exports.ImportServiceStack = ImportServiceStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LXNlcnZpY2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbXBvcnQtc2VydmljZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMsaURBQWlEO0FBQ2pELHlDQUF5QztBQUN6QywyQ0FBMkM7QUFDM0MseURBQXlEO0FBQ3pELHdEQUF3RDtBQUN4RCw2QkFBNkI7QUFDN0IsMkNBQTJDO0FBRTNDLE1BQWEsa0JBQW1CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDL0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixtQkFBbUI7UUFDbkIsTUFBTSxNQUFNLEdBQXVCLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUN6RCxJQUFJLEVBQ0osdUJBQXVCLEVBQ3ZCLHFCQUFxQixDQUN0QixDQUFDO1FBRUYseURBQXlEO1FBQ3pELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUM7UUFFaEgsNkJBQTZCO1FBQzdCLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSwwQkFBMEIsRUFBRTtZQUNyRixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSw0QkFBNEI7WUFDckMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzlELFdBQVcsRUFBRTtnQkFDWCxXQUFXLEVBQUUsTUFBTSxDQUFDLFVBQVU7YUFDL0I7U0FDRixDQUFD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QUUsSUFBSSxHQUFHLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsRUFBRTtZQUMxRyxNQUFNLEVBQUUsV0FBVztTQUNwQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUEzR0QsZ0RBMkdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgczNuIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtczMtbm90aWZpY2F0aW9uc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcblxuZXhwb3J0IGNsYXNzIEltcG9ydFNlcnZpY2VTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXRcbiAgICBjb25zdCBidWNrZXQ6IGNkay5hd3NfczMuSUJ1Y2tldCA9IHMzLkJ1Y2tldC5mcm9tQnVja2V0TmFtZShcbiAgICAgIHRoaXMsXG4gICAgICBcIkltcG9ydFNlcnZpY2VTM0J1Y2tldFwiLFxuICAgICAgXCJteS1pbXBvcnQtYnVja2V0LXV6XCIsXG4gICAgKTtcblxuICAgIC8vIFJlZmVyZW5jZSB0aGUgU1FTIHF1ZXVlIGNyZWF0ZWQgaW4gUHJvZHVjdFNlcnZpY2VTdGFja1xuICAgIGNvbnN0IHF1ZXVlID0gc3FzLlF1ZXVlLmZyb21RdWV1ZUFybih0aGlzLCAnQ2F0YWxvZ0l0ZW1zUXVldWUnLCBjZGsuRm4uaW1wb3J0VmFsdWUoJ0NhdGFsb2dJdGVtc1F1ZXVlU2VydmljZScpKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgaW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnSW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBoYW5kbGVyOiAnaW1wb3J0UHJvZHVjdHNGaWxlLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9sYW1iZGEnKSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBCVUNLRVRfTkFNRTogYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gLy8gUmVmZXJlbmNlIHRoZSBhdXRob3JpemF0aW9uIExhbWJkYSBmdW5jdGlvblxuICAgIC8vIGNvbnN0IGF1dGhvcml6ZXJMYW1iZGEgPSBsYW1iZGEuRnVuY3Rpb24uZnJvbUZ1bmN0aW9uQXJuKFxuICAgIC8vICAgdGhpcyxcbiAgICAvLyAgICdCYXNpY0F1dGhvcml6ZXInLFxuICAgIC8vICAgJ2Fybjphd3M6bGFtYmRhOmV1LW5vcnRoLTE6OTA1NDE4MjY0OTg1OmZ1bmN0aW9uOkF1dGhvcml6YXRpb25TZXJ2aWNlU3RhY2stQmFzaWNBdXRob3JpemVyMkI0OUMxRkMtYjE2YUJpQ0d4RTV3J1xuICAgIC8vICk7XG5cbiAgICAvLyAvLyBDcmVhdGUgTGFtYmRhIGF1dGhvcml6ZXJcbiAgICAvLyBjb25zdCBhdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuVG9rZW5BdXRob3JpemVyKHRoaXMsICdBdXRob3JpemVyJywge1xuICAgIC8vICAgaGFuZGxlcjogYXV0aG9yaXplckxhbWJkYSxcbiAgICAvLyB9KTtcblxuICAgIFxuXG4gICAgLy8gR3JhbnQgdGhlIExhbWJkYSBmdW5jdGlvbiBwZXJtaXNzaW9ucyB0byBpbnRlcmFjdCB3aXRoIHRoZSBTMyBidWNrZXRcbiAgICBidWNrZXQuZ3JhbnRSZWFkV3JpdGUoaW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhKTtcblxuICAgIC8vIENyZWF0ZSBBUEkgR2F0ZXdheVxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0ltcG9ydFNlcnZpY2VBcGknLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ0ltcG9ydCBTZXJ2aWNlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyBzZXJ2aWNlIGltcG9ydHMgcHJvZHVjdHMuJyxcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICAgIGFsbG93SGVhZGVyczogW1xuICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAnQ29udGVudC1UeXBlJyxcbiAgICAgICAgICAnWC1BbXotRGF0ZScsXG4gICAgICAgICAgJ1gtQW16LVNlY3VyaXR5LVRva2VuJyxcbiAgICAgICAgICAnWC1BcGktS2V5JyxcbiAgICAgICAgXSxcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGJhc2ljQXV0aG9yaXplckFybiA9IGNkay5Gbi5pbXBvcnRWYWx1ZSgnQmFzaWNBdXRob3JpemVyQXJuJyk7XG5cbiAgICBjb25zdCBhdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuQ2ZuQXV0aG9yaXplcih0aGlzLCAnQmFzaWNBdXRob3JpemVyJywge1xuICAgICAgcmVzdEFwaUlkOiBhcGkucmVzdEFwaUlkLFxuICAgICAgbmFtZTogJ0Jhc2ljQXV0aG9yaXplcicsXG4gICAgICB0eXBlOiAnVE9LRU4nLFxuICAgICAgYXV0aG9yaXplclVyaTogYGFybjphd3M6YXBpZ2F0ZXdheToke3RoaXMucmVnaW9ufTpsYW1iZGE6cGF0aC8yMDE1LTAzLTMxL2Z1bmN0aW9ucy8ke2Jhc2ljQXV0aG9yaXplckFybn0vaW52b2NhdGlvbnNgLFxuICAgICAgaWRlbnRpdHlTb3VyY2U6ICdtZXRob2QucmVxdWVzdC5oZWFkZXIuQXV0aG9yaXphdGlvbicsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgL2ltcG9ydCByZXNvdXJjZVxuICAgIGNvbnN0IGltcG9ydFJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2ltcG9ydCcpO1xuICAgXG4gICAgaW1wb3J0UmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihpbXBvcnRQcm9kdWN0c0ZpbGVMYW1iZGEpLCB7XG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcubmFtZSc6IHRydWUsXG4gICAgICB9LFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ1VTVE9NLFxuICAgICAgYXV0aG9yaXplcjogeyBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmIH0sXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgbmVjZXNzYXJ5IHBvbGljaWVzIHRvIHRoZSBMYW1iZGEgZnVuY3Rpb25cbiAgICBpbXBvcnRQcm9kdWN0c0ZpbGVMYW1iZGEuYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGFjdGlvbnM6IFsnczM6R2V0T2JqZWN0JywgJ3MzOlB1dE9iamVjdCddLFxuICAgICAgcmVzb3VyY2VzOiBbYnVja2V0LmJ1Y2tldEFybiArICcvKiddLFxuICAgIH0pKTtcblxuXG4gICAgLy8gQ3JlYXRlIHRoZSBpbXBvcnRGaWxlUGFyc2VyIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGltcG9ydEZpbGVQYXJzZXJMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdJbXBvcnRGaWxlUGFyc2VyTGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBoYW5kbGVyOiAnaW1wb3J0RmlsZVBhcnNlci5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vbGFtYmRhJykpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgU1FTX1FVRVVFX1VSTDogcXVldWUucXVldWVVcmwsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgdGhlIExhbWJkYSBmdW5jdGlvbiBwZXJtaXNzaW9ucyB0byByZWFkIGZyb20gdGhlIFMzIGJ1Y2tldFxuICAgIGJ1Y2tldC5ncmFudFJlYWRXcml0ZShpbXBvcnRGaWxlUGFyc2VyTGFtYmRhKTtcblxuICAgICAvLyBHcmFudCBwZXJtaXNzaW9ucyB0byBzZW5kIG1lc3NhZ2VzIHRvIHRoZSBTUVMgcXVldWVcbiAgICBxdWV1ZS5ncmFudFNlbmRNZXNzYWdlcyhpbXBvcnRGaWxlUGFyc2VyTGFtYmRhKTtcblxuICAgIC8vIEFkZCBTMyBldmVudCBub3RpZmljYXRpb24gdG8gdHJpZ2dlciB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgYnVja2V0LmFkZEV2ZW50Tm90aWZpY2F0aW9uKHMzLkV2ZW50VHlwZS5PQkpFQ1RfQ1JFQVRFRCwgbmV3IHMzbi5MYW1iZGFEZXN0aW5hdGlvbihpbXBvcnRGaWxlUGFyc2VyTGFtYmRhKSwge1xuICAgICAgcHJlZml4OiAndXBsb2FkZWQvJyxcbiAgICB9KTtcbiAgfVxufVxuIl19