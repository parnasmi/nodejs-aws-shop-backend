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
        // Define the SQS queue
        const queue = new sqs.Queue(this, 'CatalogItemsQueue', {
            visibilityTimeout: cdk.Duration.seconds(30),
            receiveMessageWaitTime: cdk.Duration.seconds(20),
        });
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
            environment: {
                SQS_QUEUE_URL: queue.queueUrl,
            },
        });
        // Grant the Lambda function permissions to read from the S3 bucket
        bucket.grantReadWrite(importFileParserLambda);
        // Grant the Lambda function permissions to send messages to the SQS queue
        queue.grantSendMessages(importFileParserLambda);
        // Add S3 event notification to trigger the Lambda function
        bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParserLambda), {
            prefix: 'uploaded/',
        });
    }
}
exports.ImportServiceStack = ImportServiceStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LXNlcnZpY2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbXBvcnQtc2VydmljZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMsaURBQWlEO0FBQ2pELHlDQUF5QztBQUN6QywyQ0FBMkM7QUFDM0MseURBQXlEO0FBQ3pELHdEQUF3RDtBQUN4RCw2QkFBNkI7QUFDN0IsMkNBQTJDO0FBRTNDLE1BQWEsa0JBQW1CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDL0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixtQkFBbUI7UUFDbkIsTUFBTSxNQUFNLEdBQXVCLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUN6RCxJQUFJLEVBQ0osdUJBQXVCLEVBQ3ZCLHFCQUFxQixDQUN0QixDQUFDO1FBRUYsdUJBQXVCO1FBQ3ZCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDckQsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQzNDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztTQUNqRCxDQUFDLENBQUM7UUFFSCw2QkFBNkI7UUFDN0IsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQ3JGLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLDRCQUE0QjtZQUNyQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDOUQsV0FBVyxFQUFFO2dCQUNYLFdBQVcsRUFBRSxNQUFNLENBQUMsVUFBVTthQUMvQjtTQUNGLENBQUMsQ0FBQztRQUlILHVFQUF1RTtRQUN2RSxNQUFNLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFFaEQscUJBQXFCO1FBQ3JCLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDM0QsV0FBVyxFQUFFLGdCQUFnQjtZQUM3QixXQUFXLEVBQUUsZ0NBQWdDO1NBQzlDLENBQUMsQ0FBQztRQUVILDBCQUEwQjtRQUMxQixNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV0RCxjQUFjLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFO1lBQzFGLGlCQUFpQixFQUFFO2dCQUNqQixpQ0FBaUMsRUFBRSxJQUFJO2FBQ3hDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsZ0RBQWdEO1FBQ2hELHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7WUFDL0QsT0FBTyxFQUFFLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQztZQUN6QyxTQUFTLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztTQUNyQyxDQUFDLENBQUMsQ0FBQztRQUdKLDhDQUE4QztRQUM5QyxNQUFNLHNCQUFzQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLEVBQUU7WUFDakYsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsMEJBQTBCO1lBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM5RCxXQUFXLEVBQUU7Z0JBQ1gsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRO2FBQzlCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsbUVBQW1FO1FBQ25FLE1BQU0sQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUU5QywwRUFBMEU7UUFDMUUsS0FBSyxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFFaEQsMkRBQTJEO1FBQzNELE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFO1lBQzFHLE1BQU0sRUFBRSxXQUFXO1NBQ3BCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTNFRCxnREEyRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBzM24gZnJvbSBcImF3cy1jZGstbGliL2F3cy1zMy1ub3RpZmljYXRpb25zXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgc3FzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xuXG5leHBvcnQgY2xhc3MgSW1wb3J0U2VydmljZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gQ3JlYXRlIFMzIGJ1Y2tldFxuICAgIGNvbnN0IGJ1Y2tldDogY2RrLmF3c19zMy5JQnVja2V0ID0gczMuQnVja2V0LmZyb21CdWNrZXROYW1lKFxuICAgICAgdGhpcyxcbiAgICAgIFwiSW1wb3J0U2VydmljZVMzQnVja2V0XCIsXG4gICAgICBcIm15LWltcG9ydC1idWNrZXQtdXpcIixcbiAgICApO1xuXG4gICAgLy8gRGVmaW5lIHRoZSBTUVMgcXVldWVcbiAgICBjb25zdCBxdWV1ZSA9IG5ldyBzcXMuUXVldWUodGhpcywgJ0NhdGFsb2dJdGVtc1F1ZXVlJywge1xuICAgICAgdmlzaWJpbGl0eVRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIHJlY2VpdmVNZXNzYWdlV2FpdFRpbWU6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDIwKSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgaW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnSW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBoYW5kbGVyOiAnaW1wb3J0UHJvZHVjdHNGaWxlLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9sYW1iZGEnKSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBCVUNLRVRfTkFNRTogYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgXG5cbiAgICAvLyBHcmFudCB0aGUgTGFtYmRhIGZ1bmN0aW9uIHBlcm1pc3Npb25zIHRvIGludGVyYWN0IHdpdGggdGhlIFMzIGJ1Y2tldFxuICAgIGJ1Y2tldC5ncmFudFJlYWRXcml0ZShpbXBvcnRQcm9kdWN0c0ZpbGVMYW1iZGEpO1xuXG4gICAgLy8gQ3JlYXRlIEFQSSBHYXRld2F5XG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnSW1wb3J0U2VydmljZUFwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiAnSW1wb3J0IFNlcnZpY2UnLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGlzIHNlcnZpY2UgaW1wb3J0cyBwcm9kdWN0cy4nLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIC9pbXBvcnQgcmVzb3VyY2VcbiAgICBjb25zdCBpbXBvcnRSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdpbXBvcnQnKTtcbiAgIFxuICAgIGltcG9ydFJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oaW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhKSwge1xuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLm5hbWUnOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBuZWNlc3NhcnkgcG9saWNpZXMgdG8gdGhlIExhbWJkYSBmdW5jdGlvblxuICAgIGltcG9ydFByb2R1Y3RzRmlsZUxhbWJkYS5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnLCAnczM6UHV0T2JqZWN0J10sXG4gICAgICByZXNvdXJjZXM6IFtidWNrZXQuYnVja2V0QXJuICsgJy8qJ10sXG4gICAgfSkpO1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIGltcG9ydEZpbGVQYXJzZXIgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgaW1wb3J0RmlsZVBhcnNlckxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0ltcG9ydEZpbGVQYXJzZXJMYW1iZGEnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTZfWCxcbiAgICAgIGhhbmRsZXI6ICdpbXBvcnRGaWxlUGFyc2VyLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9sYW1iZGEnKSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTUVNfUVVFVUVfVVJMOiBxdWV1ZS5xdWV1ZVVybCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCB0aGUgTGFtYmRhIGZ1bmN0aW9uIHBlcm1pc3Npb25zIHRvIHJlYWQgZnJvbSB0aGUgUzMgYnVja2V0XG4gICAgYnVja2V0LmdyYW50UmVhZFdyaXRlKGltcG9ydEZpbGVQYXJzZXJMYW1iZGEpO1xuXG4gICAgLy8gR3JhbnQgdGhlIExhbWJkYSBmdW5jdGlvbiBwZXJtaXNzaW9ucyB0byBzZW5kIG1lc3NhZ2VzIHRvIHRoZSBTUVMgcXVldWVcbiAgICBxdWV1ZS5ncmFudFNlbmRNZXNzYWdlcyhpbXBvcnRGaWxlUGFyc2VyTGFtYmRhKTtcblxuICAgIC8vIEFkZCBTMyBldmVudCBub3RpZmljYXRpb24gdG8gdHJpZ2dlciB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgYnVja2V0LmFkZEV2ZW50Tm90aWZpY2F0aW9uKHMzLkV2ZW50VHlwZS5PQkpFQ1RfQ1JFQVRFRCwgbmV3IHMzbi5MYW1iZGFEZXN0aW5hdGlvbihpbXBvcnRGaWxlUGFyc2VyTGFtYmRhKSwge1xuICAgICAgcHJlZml4OiAndXBsb2FkZWQvJyxcbiAgICB9KTtcbiAgfVxufVxuIl19