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
        // Grant permissions to send messages to the SQS queue
        queue.grantSendMessages(importFileParserLambda);
        // Add S3 event notification to trigger the Lambda function
        bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParserLambda), {
            prefix: 'uploaded/',
        });
    }
}
exports.ImportServiceStack = ImportServiceStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LXNlcnZpY2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbXBvcnQtc2VydmljZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMsaURBQWlEO0FBQ2pELHlDQUF5QztBQUN6QywyQ0FBMkM7QUFDM0MseURBQXlEO0FBQ3pELHdEQUF3RDtBQUN4RCw2QkFBNkI7QUFDN0IsMkNBQTJDO0FBRTNDLE1BQWEsa0JBQW1CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDL0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixtQkFBbUI7UUFDbkIsTUFBTSxNQUFNLEdBQXVCLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUN6RCxJQUFJLEVBQ0osdUJBQXVCLEVBQ3ZCLHFCQUFxQixDQUN0QixDQUFDO1FBRUYseURBQXlEO1FBQ3pELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUM7UUFFaEgsNkJBQTZCO1FBQzdCLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSwwQkFBMEIsRUFBRTtZQUNyRixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSw0QkFBNEI7WUFDckMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzlELFdBQVcsRUFBRTtnQkFDWCxXQUFXLEVBQUUsTUFBTSxDQUFDLFVBQVU7YUFDL0I7U0FDRixDQUFDLENBQUM7UUFJSCx1RUFBdUU7UUFDdkUsTUFBTSxDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBRWhELHFCQUFxQjtRQUNyQixNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzNELFdBQVcsRUFBRSxnQkFBZ0I7WUFDN0IsV0FBVyxFQUFFLGdDQUFnQztTQUM5QyxDQUFDLENBQUM7UUFFSCwwQkFBMEI7UUFDMUIsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFdEQsY0FBYyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsd0JBQXdCLENBQUMsRUFBRTtZQUMxRixpQkFBaUIsRUFBRTtnQkFDakIsaUNBQWlDLEVBQUUsSUFBSTthQUN4QztTQUNGLENBQUMsQ0FBQztRQUVILGdEQUFnRDtRQUNoRCx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQy9ELE9BQU8sRUFBRSxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUM7WUFDekMsU0FBUyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDckMsQ0FBQyxDQUFDLENBQUM7UUFHSiw4Q0FBOEM7UUFDOUMsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLHdCQUF3QixFQUFFO1lBQ2pGLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLDBCQUEwQjtZQUNuQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDOUQsV0FBVyxFQUFFO2dCQUNYLGFBQWEsRUFBRSxLQUFLLENBQUMsUUFBUTthQUM5QjtTQUNGLENBQUMsQ0FBQztRQUVILG1FQUFtRTtRQUNuRSxNQUFNLENBQUMsY0FBYyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFFN0Msc0RBQXNEO1FBQ3ZELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBRWhELDJEQUEyRDtRQUMzRCxNQUFNLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsSUFBSSxHQUFHLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsRUFBRTtZQUMxRyxNQUFNLEVBQUUsV0FBVztTQUNwQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF4RUQsZ0RBd0VDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgczNuIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtczMtbm90aWZpY2F0aW9uc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcblxuZXhwb3J0IGNsYXNzIEltcG9ydFNlcnZpY2VTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXRcbiAgICBjb25zdCBidWNrZXQ6IGNkay5hd3NfczMuSUJ1Y2tldCA9IHMzLkJ1Y2tldC5mcm9tQnVja2V0TmFtZShcbiAgICAgIHRoaXMsXG4gICAgICBcIkltcG9ydFNlcnZpY2VTM0J1Y2tldFwiLFxuICAgICAgXCJteS1pbXBvcnQtYnVja2V0LXV6XCIsXG4gICAgKTtcblxuICAgIC8vIFJlZmVyZW5jZSB0aGUgU1FTIHF1ZXVlIGNyZWF0ZWQgaW4gUHJvZHVjdFNlcnZpY2VTdGFja1xuICAgIGNvbnN0IHF1ZXVlID0gc3FzLlF1ZXVlLmZyb21RdWV1ZUFybih0aGlzLCAnQ2F0YWxvZ0l0ZW1zUXVldWUnLCBjZGsuRm4uaW1wb3J0VmFsdWUoJ0NhdGFsb2dJdGVtc1F1ZXVlU2VydmljZScpKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgaW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnSW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBoYW5kbGVyOiAnaW1wb3J0UHJvZHVjdHNGaWxlLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9sYW1iZGEnKSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBCVUNLRVRfTkFNRTogYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgXG5cbiAgICAvLyBHcmFudCB0aGUgTGFtYmRhIGZ1bmN0aW9uIHBlcm1pc3Npb25zIHRvIGludGVyYWN0IHdpdGggdGhlIFMzIGJ1Y2tldFxuICAgIGJ1Y2tldC5ncmFudFJlYWRXcml0ZShpbXBvcnRQcm9kdWN0c0ZpbGVMYW1iZGEpO1xuXG4gICAgLy8gQ3JlYXRlIEFQSSBHYXRld2F5XG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnSW1wb3J0U2VydmljZUFwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiAnSW1wb3J0IFNlcnZpY2UnLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGlzIHNlcnZpY2UgaW1wb3J0cyBwcm9kdWN0cy4nLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIC9pbXBvcnQgcmVzb3VyY2VcbiAgICBjb25zdCBpbXBvcnRSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdpbXBvcnQnKTtcbiAgIFxuICAgIGltcG9ydFJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oaW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhKSwge1xuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLm5hbWUnOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBuZWNlc3NhcnkgcG9saWNpZXMgdG8gdGhlIExhbWJkYSBmdW5jdGlvblxuICAgIGltcG9ydFByb2R1Y3RzRmlsZUxhbWJkYS5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnLCAnczM6UHV0T2JqZWN0J10sXG4gICAgICByZXNvdXJjZXM6IFtidWNrZXQuYnVja2V0QXJuICsgJy8qJ10sXG4gICAgfSkpO1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIGltcG9ydEZpbGVQYXJzZXIgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgaW1wb3J0RmlsZVBhcnNlckxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0ltcG9ydEZpbGVQYXJzZXJMYW1iZGEnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTZfWCxcbiAgICAgIGhhbmRsZXI6ICdpbXBvcnRGaWxlUGFyc2VyLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9sYW1iZGEnKSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTUVNfUVVFVUVfVVJMOiBxdWV1ZS5xdWV1ZVVybCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCB0aGUgTGFtYmRhIGZ1bmN0aW9uIHBlcm1pc3Npb25zIHRvIHJlYWQgZnJvbSB0aGUgUzMgYnVja2V0XG4gICAgYnVja2V0LmdyYW50UmVhZFdyaXRlKGltcG9ydEZpbGVQYXJzZXJMYW1iZGEpO1xuXG4gICAgIC8vIEdyYW50IHBlcm1pc3Npb25zIHRvIHNlbmQgbWVzc2FnZXMgdG8gdGhlIFNRUyBxdWV1ZVxuICAgIHF1ZXVlLmdyYW50U2VuZE1lc3NhZ2VzKGltcG9ydEZpbGVQYXJzZXJMYW1iZGEpO1xuXG4gICAgLy8gQWRkIFMzIGV2ZW50IG5vdGlmaWNhdGlvbiB0byB0cmlnZ2VyIHRoZSBMYW1iZGEgZnVuY3Rpb25cbiAgICBidWNrZXQuYWRkRXZlbnROb3RpZmljYXRpb24oczMuRXZlbnRUeXBlLk9CSkVDVF9DUkVBVEVELCBuZXcgczNuLkxhbWJkYURlc3RpbmF0aW9uKGltcG9ydEZpbGVQYXJzZXJMYW1iZGEpLCB7XG4gICAgICBwcmVmaXg6ICd1cGxvYWRlZC8nLFxuICAgIH0pO1xuICB9XG59XG4iXX0=