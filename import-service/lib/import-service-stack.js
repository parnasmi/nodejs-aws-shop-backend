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
class ImportServiceStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create S3 bucket
        const bucket = s3.Bucket.fromBucketName(this, "ImportServiceS3Bucket", "my-import-bucket-uz");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LXNlcnZpY2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbXBvcnQtc2VydmljZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMsaURBQWlEO0FBQ2pELHlDQUF5QztBQUN6QywyQ0FBMkM7QUFDM0MseURBQXlEO0FBQ3pELHdEQUF3RDtBQUN4RCw2QkFBNkI7QUFFN0IsTUFBYSxrQkFBbUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUMvQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLG1CQUFtQjtRQUNuQixNQUFNLE1BQU0sR0FBdUIsRUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQ3pELElBQUksRUFDSix1QkFBdUIsRUFDdkIscUJBQXFCLENBQ3RCLENBQUM7UUFFRiw2QkFBNkI7UUFDN0IsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQ3JGLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLDRCQUE0QjtZQUNyQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDOUQsV0FBVyxFQUFFO2dCQUNYLFdBQVcsRUFBRSxNQUFNLENBQUMsVUFBVTthQUMvQjtTQUNGLENBQUMsQ0FBQztRQUVILHVFQUF1RTtRQUN2RSxNQUFNLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFFaEQscUJBQXFCO1FBQ3JCLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDM0QsV0FBVyxFQUFFLGdCQUFnQjtZQUM3QixXQUFXLEVBQUUsZ0NBQWdDO1NBQzlDLENBQUMsQ0FBQztRQUVILDBCQUEwQjtRQUMxQixNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV0RCxjQUFjLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFO1lBQzFGLGlCQUFpQixFQUFFO2dCQUNqQixpQ0FBaUMsRUFBRSxJQUFJO2FBQ3hDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsZ0RBQWdEO1FBQ2hELHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7WUFDL0QsT0FBTyxFQUFFLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQztZQUN6QyxTQUFTLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztTQUNyQyxDQUFDLENBQUMsQ0FBQztRQUdKLDhDQUE4QztRQUM5QyxNQUFNLHNCQUFzQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLEVBQUU7WUFDakYsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsMEJBQTBCO1lBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUMvRCxDQUFDLENBQUM7UUFFSCxtRUFBbUU7UUFDbkUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBRTlDLDJEQUEyRDtRQUMzRCxNQUFNLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsSUFBSSxHQUFHLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsRUFBRTtZQUMxRyxNQUFNLEVBQUUsV0FBVztTQUNwQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE3REQsZ0RBNkRDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgczNuIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtczMtbm90aWZpY2F0aW9uc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNsYXNzIEltcG9ydFNlcnZpY2VTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXRcbiAgICBjb25zdCBidWNrZXQ6IGNkay5hd3NfczMuSUJ1Y2tldCA9IHMzLkJ1Y2tldC5mcm9tQnVja2V0TmFtZShcbiAgICAgIHRoaXMsXG4gICAgICBcIkltcG9ydFNlcnZpY2VTM0J1Y2tldFwiLFxuICAgICAgXCJteS1pbXBvcnQtYnVja2V0LXV6XCIsXG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgaW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnSW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBoYW5kbGVyOiAnaW1wb3J0UHJvZHVjdHNGaWxlLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9sYW1iZGEnKSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBCVUNLRVRfTkFNRTogYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgdGhlIExhbWJkYSBmdW5jdGlvbiBwZXJtaXNzaW9ucyB0byBpbnRlcmFjdCB3aXRoIHRoZSBTMyBidWNrZXRcbiAgICBidWNrZXQuZ3JhbnRSZWFkV3JpdGUoaW1wb3J0UHJvZHVjdHNGaWxlTGFtYmRhKTtcblxuICAgIC8vIENyZWF0ZSBBUEkgR2F0ZXdheVxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0ltcG9ydFNlcnZpY2VBcGknLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ0ltcG9ydCBTZXJ2aWNlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyBzZXJ2aWNlIGltcG9ydHMgcHJvZHVjdHMuJyxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSAvaW1wb3J0IHJlc291cmNlXG4gICAgY29uc3QgaW1wb3J0UmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnaW1wb3J0Jyk7XG4gICBcbiAgICBpbXBvcnRSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGltcG9ydFByb2R1Y3RzRmlsZUxhbWJkYSksIHtcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgICdtZXRob2QucmVxdWVzdC5xdWVyeXN0cmluZy5uYW1lJzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgbmVjZXNzYXJ5IHBvbGljaWVzIHRvIHRoZSBMYW1iZGEgZnVuY3Rpb25cbiAgICBpbXBvcnRQcm9kdWN0c0ZpbGVMYW1iZGEuYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGFjdGlvbnM6IFsnczM6R2V0T2JqZWN0JywgJ3MzOlB1dE9iamVjdCddLFxuICAgICAgcmVzb3VyY2VzOiBbYnVja2V0LmJ1Y2tldEFybiArICcvKiddLFxuICAgIH0pKTtcblxuXG4gICAgLy8gQ3JlYXRlIHRoZSBpbXBvcnRGaWxlUGFyc2VyIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGltcG9ydEZpbGVQYXJzZXJMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdJbXBvcnRGaWxlUGFyc2VyTGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBoYW5kbGVyOiAnaW1wb3J0RmlsZVBhcnNlci5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vbGFtYmRhJykpLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgdGhlIExhbWJkYSBmdW5jdGlvbiBwZXJtaXNzaW9ucyB0byByZWFkIGZyb20gdGhlIFMzIGJ1Y2tldFxuICAgIGJ1Y2tldC5ncmFudFJlYWRXcml0ZShpbXBvcnRGaWxlUGFyc2VyTGFtYmRhKTtcblxuICAgIC8vIEFkZCBTMyBldmVudCBub3RpZmljYXRpb24gdG8gdHJpZ2dlciB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgYnVja2V0LmFkZEV2ZW50Tm90aWZpY2F0aW9uKHMzLkV2ZW50VHlwZS5PQkpFQ1RfQ1JFQVRFRCwgbmV3IHMzbi5MYW1iZGFEZXN0aW5hdGlvbihpbXBvcnRGaWxlUGFyc2VyTGFtYmRhKSwge1xuICAgICAgcHJlZml4OiAndXBsb2FkZWQvJyxcbiAgICB9KTtcbiAgfVxufVxuIl19