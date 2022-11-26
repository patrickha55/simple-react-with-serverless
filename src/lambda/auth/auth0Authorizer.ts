import {
    APIGatewayAuthorizerHandler,
    APIGatewayAuthorizerResult,
    APIGatewayTokenAuthorizerEvent,
} from 'aws-lambda';
import { verify } from 'jsonwebtoken';
import { config } from '../../../config';
import { JwtToken } from '../../auth/JwtToken';

export const handler: APIGatewayAuthorizerHandler = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
    const allResources: string = '*';
    const allow: string = 'Allow';
    const deny: string = 'Deny';
    
    try {
        const decodedToken = verifyToken(event.authorizationToken);

        return generatePolicy(decodedToken.sub, allResources, allow);
    } catch (error) {
        console.error(JSON.stringify(error));

        return generatePolicy('user', allResources, deny);
    }
};

/**
 * Verify the passed in bearer token for authentication.
 * @param authHeader The authentication header contains a bearer token.
 * @returns A decoded Jwt Token.
 */
function verifyToken(authHeader: string): JwtToken {
    if (!authHeader) throw new Error('No authorization header.');

    if (!authHeader.startsWith('Bearer '))
        throw new Error('Invalid authorization header.');

    const split = authHeader.split(' ');

    const token = split[1];

    const auth0Secret = config.AUTH_0_SECRET;

    return verify(token, auth0Secret) as JwtToken;
}

/**
 * Generate an api gateway authorizer policy for authentication.
 * @param principalId An id of a user
 * @param resource Resources an user can access. Pass in '*' for all resources.
 * @param effect Allow or Deny.
 * @returns A policy for api gateway.
 */
function generatePolicy(principalId: string, resource: string, effect: string): APIGatewayAuthorizerResult {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource
                }
            ]
        }
    };
}
