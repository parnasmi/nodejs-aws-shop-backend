import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent, PolicyDocument } from 'aws-lambda';
import * as dotenv from 'dotenv';
import { HEADERS } from '../utils/utils';
import { HTTP_RESPONSE } from '../types/types';

dotenv.config();

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult | HTTP_RESPONSE > => {
  console.log('Event: ', event);
  if (!event.authorizationToken) {
    return {
      statusCode:401,
      headers: HEADERS,
      body: JSON.stringify('Unauthorized'),
    }
  }

  try {
    const token = event.authorizationToken.split(' ')[1];
    const [username, password] = Buffer.from(token, 'base64').toString('utf-8').split(':');

    const storedPassword = process.env[username];

    if (storedPassword && storedPassword === password) {
      return generatePolicy('user', 'Allow', event.methodArn);
    }

    return {
      statusCode:403,
      headers: HEADERS,
      body: JSON.stringify('Access is denied'),
    }
  } catch (error) {
    return {
      statusCode:403,
      headers: HEADERS,
      body: JSON.stringify(`error - ${error}`),
    }
  }
};

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

//TODO: remove commented code

// import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, Context } from 'aws-lambda';
// import * as dotenv from 'dotenv';

// dotenv.config();

// export const handler = async (
//   event: APIGatewayTokenAuthorizerEvent,
//   _context: Context
// ): Promise<APIGatewayAuthorizerResult> => {
//   if (!event.authorizationToken) {
//     return generatePolicy('user', 'Deny', event.methodArn);
//   }

//   const authHeader = event.authorizationToken;
//   const encodedCreds = authHeader.split(' ')[1];
//   const buffer = Buffer.from(encodedCreds, 'base64');
//   const plainCreds = buffer.toString('ascii').split(':');
//   const username = plainCreds[0];
//   const password = plainCreds[1];

//   const storedPassword = process.env[username];

//   if (storedPassword && storedPassword === password) {
//     return generatePolicy('user', 'Allow', event.methodArn);
//   }

//   return generatePolicy('user', 'Deny', event.methodArn);
// };

// const generatePolicy = (principalId: string, effect: string, resource: string): APIGatewayAuthorizerResult => {
//   const policyDocument = {
//     Version: '2012-10-17',
//     Statement: [
//       {
//         Action: 'execute-api:Invoke',
//         Effect: effect,
//         Resource: resource,
//       },
//     ],
//   };

//   return {
//     principalId,
//     policyDocument,
//   };
// };
