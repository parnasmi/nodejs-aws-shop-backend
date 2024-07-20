
// import { APIGatewayAuthorizerEvent, APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
// import * as dotenv from 'dotenv';

// dotenv.config();

// const generatePolicy = (principalId: string, effect: string, resource: string): APIGatewayAuthorizerResult => {
//   return {
//     principalId,
//     policyDocument: {
//       Version: '2012-10-17',
//       Statement: [
//         {
//           Action: 'execute-api:Invoke',
//           Effect: effect as 'Allow' | 'Deny',  
//           Resource: resource,
//         },
//       ],
//     },
//   };
// };

// export const handler = async (event: APIGatewayTokenAuthorizerEvent) => {
//   if (!event.authorizationToken) {
//     return {
//       statusCode: 401,
//       body: 'Unauthorized',
//     };
//   }

//   const token = event.authorizationToken.split(' ')[1];
//   const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
//   const [username, password] = decodedToken.split(':');

//   const expectedPassword = process.env[username];

//   if (expectedPassword === password) {
//     return generatePolicy(username, 'Allow', event.methodArn);
//   }

//   return {
//     statusCode: 403,
//     body: 'Forbidden',
//   };
// };


import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent, PolicyDocument } from 'aws-lambda';
import * as dotenv from 'dotenv';
import { HTTP_RESPONSE } from '../types/types';

dotenv.config();


const generatePolicy = (principalId: string, effect: string, resource: string) => {
    const policyDocument:PolicyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect as 'Allow' | 'Deny',
          Resource: resource,
        },
      ],
    };
  
    return {
      principalId,
      policyDocument,
    };
  };

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult | HTTP_RESPONSE > => {
    console.log('handler Event: ', event);
    if (!event.authorizationToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }
  
    try {
        const token = event.authorizationToken.split(' ')[1];
        const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
        const [username, password] = decodedToken.includes(":") ? decodedToken.split(':'): ['test','test'];
        const expectedPassword = process.env[username.trim()];


        if (expectedPassword === password) {
            return generatePolicy(username, 'Allow', event.methodArn);
        }

        return generatePolicy('unauthorized', 'Deny', event.methodArn);
        
    } catch (error) {
      return {
        statusCode:500,
        body: JSON.stringify({ message: `error - ${error}` })
      }
    }
  };
