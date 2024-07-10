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
        // // Define the SQS queue
        // const queue = new sqs.Queue(this, 'CatalogItemsQueue', {
        //   visibilityTimeout: cdk.Duration.seconds(30),
        //   receiveMessageWaitTime: cdk.Duration.seconds(20),
        // });
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
        // Add S3 event notification to trigger the Lambda function
        bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParserLambda), {
            prefix: 'uploaded/',
        });
    }
}
exports.ImportServiceStack = ImportServiceStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LXNlcnZpY2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbXBvcnQtc2VydmljZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMsaURBQWlEO0FBQ2pELHlDQUF5QztBQUN6QywyQ0FBMkM7QUFDM0MseURBQXlEO0FBQ3pELHdEQUF3RDtBQUN4RCw2QkFBNkI7QUFDN0IsMkNBQTJDO0FBRTNDLE1BQWEsa0JBQW1CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDL0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixtQkFBbUI7UUFDbkIsTUFBTSxNQUFNLEdBQXVCLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUN6RCxJQUFJLEVBQ0osdUJBQXVCLEVBQ3ZCLHFCQUFxQixDQUN0QixDQUFDO1FBRUYsMEJBQTBCO1FBQzFCLDJEQUEyRDtRQUMzRCxpREFBaUQ7UUFDakQsc0RBQXNEO1FBQ3RELE1BQU07UUFFTix5REFBeUQ7UUFDekQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQztRQUVoSCw2QkFBNkI7UUFDN0IsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQ3JGLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLDRCQUE0QjtZQUNyQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDOUQsV0FBVyxFQUFFO2dCQUNYLFdBQVcsRUFBRSxNQUFNLENBQUMsVUFBVTthQUMvQjtTQUNGLENBQUMsQ0FBQztRQUlILHVFQUF1RTtRQUN2RSxNQUFNLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFFaEQscUJBQXFCO1FBQ3JCLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDM0QsV0FBVyxFQUFFLGdCQUFnQjtZQUM3QixXQUFXLEVBQUUsZ0NBQWdDO1NBQzlDLENBQUMsQ0FBQztRQUVILDBCQUEwQjtRQUMxQixNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV0RCxjQUFjLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFO1lBQzFGLGlCQUFpQixFQUFFO2dCQUNqQixpQ0FBaUMsRUFBRSxJQUFJO2FBQ3hDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsZ0RBQWdEO1FBQ2hELHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7WUFDL0QsT0FBTyxFQUFFLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQztZQUN6QyxTQUFTLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztTQUNyQyxDQUFDLENBQUMsQ0FBQztRQUdKLDhDQUE4QztRQUM5QyxNQUFNLHNCQUFzQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLEVBQUU7WUFDakYsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsMEJBQTBCO1lBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM5RCxXQUFXLEVBQUU7Z0JBQ1gsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRO2FBQzlCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsbUVBQW1FO1FBQ25FLE1BQU0sQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUU5QywyREFBMkQ7UUFDM0QsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLElBQUksR0FBRyxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixDQUFDLEVBQUU7WUFDMUcsTUFBTSxFQUFFLFdBQVc7U0FDcEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBM0VELGdEQTJFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIHMzbiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXMzLW5vdGlmaWNhdGlvbnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBzcXMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNxcyc7XG5cbmV4cG9ydCBjbGFzcyBJbXBvcnRTZXJ2aWNlU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBDcmVhdGUgUzMgYnVja2V0XG4gICAgY29uc3QgYnVja2V0OiBjZGsuYXdzX3MzLklCdWNrZXQgPSBzMy5CdWNrZXQuZnJvbUJ1Y2tldE5hbWUoXG4gICAgICB0aGlzLFxuICAgICAgXCJJbXBvcnRTZXJ2aWNlUzNCdWNrZXRcIixcbiAgICAgIFwibXktaW1wb3J0LWJ1Y2tldC11elwiLFxuICAgICk7XG5cbiAgICAvLyAvLyBEZWZpbmUgdGhlIFNRUyBxdWV1ZVxuICAgIC8vIGNvbnN0IHF1ZXVlID0gbmV3IHNxcy5RdWV1ZSh0aGlzLCAnQ2F0YWxvZ0l0ZW1zUXVldWUnLCB7XG4gICAgLy8gICB2aXNpYmlsaXR5VGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgIC8vICAgcmVjZWl2ZU1lc3NhZ2VXYWl0VGltZTogY2RrLkR1cmF0aW9uLnNlY29uZHMoMjApLFxuICAgIC8vIH0pO1xuXG4gICAgLy8gUmVmZXJlbmNlIHRoZSBTUVMgcXVldWUgY3JlYXRlZCBpbiBQcm9kdWN0U2VydmljZVN0YWNrXG4gICAgY29uc3QgcXVldWUgPSBzcXMuUXVldWUuZnJvbVF1ZXVlQXJuKHRoaXMsICdDYXRhbG9nSXRlbXNRdWV1ZScsIGNkay5Gbi5pbXBvcnRWYWx1ZSgnQ2F0YWxvZ0l0ZW1zUXVldWVTZXJ2aWNlJykpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCBpbXBvcnRQcm9kdWN0c0ZpbGVMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdJbXBvcnRQcm9kdWN0c0ZpbGVMYW1iZGEnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTZfWCxcbiAgICAgIGhhbmRsZXI6ICdpbXBvcnRQcm9kdWN0c0ZpbGUuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2xhbWJkYScpKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEJVQ0tFVF9OQU1FOiBidWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBcblxuICAgIC8vIEdyYW50IHRoZSBMYW1iZGEgZnVuY3Rpb24gcGVybWlzc2lvbnMgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgUzMgYnVja2V0XG4gICAgYnVja2V0LmdyYW50UmVhZFdyaXRlKGltcG9ydFByb2R1Y3RzRmlsZUxhbWJkYSk7XG5cbiAgICAvLyBDcmVhdGUgQVBJIEdhdGV3YXlcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdJbXBvcnRTZXJ2aWNlQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6ICdJbXBvcnQgU2VydmljZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoaXMgc2VydmljZSBpbXBvcnRzIHByb2R1Y3RzLicsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgL2ltcG9ydCByZXNvdXJjZVxuICAgIGNvbnN0IGltcG9ydFJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2ltcG9ydCcpO1xuICAgXG4gICAgaW1wb3J0UmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihpbXBvcnRQcm9kdWN0c0ZpbGVMYW1iZGEpLCB7XG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcubmFtZSc6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIG5lY2Vzc2FyeSBwb2xpY2llcyB0byB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgaW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCcsICdzMzpQdXRPYmplY3QnXSxcbiAgICAgIHJlc291cmNlczogW2J1Y2tldC5idWNrZXRBcm4gKyAnLyonXSxcbiAgICB9KSk7XG5cblxuICAgIC8vIENyZWF0ZSB0aGUgaW1wb3J0RmlsZVBhcnNlciBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCBpbXBvcnRGaWxlUGFyc2VyTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnSW1wb3J0RmlsZVBhcnNlckxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgaGFuZGxlcjogJ2ltcG9ydEZpbGVQYXJzZXIuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2xhbWJkYScpKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFNRU19RVUVVRV9VUkw6IHF1ZXVlLnF1ZXVlVXJsLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHRoZSBMYW1iZGEgZnVuY3Rpb24gcGVybWlzc2lvbnMgdG8gcmVhZCBmcm9tIHRoZSBTMyBidWNrZXRcbiAgICBidWNrZXQuZ3JhbnRSZWFkV3JpdGUoaW1wb3J0RmlsZVBhcnNlckxhbWJkYSk7XG5cbiAgICAvLyBBZGQgUzMgZXZlbnQgbm90aWZpY2F0aW9uIHRvIHRyaWdnZXIgdGhlIExhbWJkYSBmdW5jdGlvblxuICAgIGJ1Y2tldC5hZGRFdmVudE5vdGlmaWNhdGlvbihzMy5FdmVudFR5cGUuT0JKRUNUX0NSRUFURUQsIG5ldyBzM24uTGFtYmRhRGVzdGluYXRpb24oaW1wb3J0RmlsZVBhcnNlckxhbWJkYSksIHtcbiAgICAgIHByZWZpeDogJ3VwbG9hZGVkLycsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==