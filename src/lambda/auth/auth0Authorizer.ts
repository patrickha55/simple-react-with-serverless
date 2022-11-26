import {
    APIGatewayAuthorizerHandler,
    APIGatewayAuthorizerResult,
    APIGatewayTokenAuthorizerEvent,
} from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { verify } from 'jsonwebtoken';
import { config } from '../../../config';
import { JwtToken } from '../../auth/JwtToken';

let cachedSecret: string = '';
export const handler: APIGatewayAuthorizerHandler = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
    const allResources: string = '*';
    const allow: string = 'Allow';
    const deny: string = 'Deny';

    try {
        const decodedToken = await verifyToken(event.authorizationToken);

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
async function verifyToken(authHeader: string): Promise<JwtToken> {
    if (!authHeader) throw new Error('No authorization header.');

    if (!authHeader.startsWith('Bearer '))
        throw new Error('Invalid authorization header.');

    const split = authHeader.split(' ');

    const token = split[1];

    const secretObject = await getAuth0Secret();

    const secretField = config.AUTH_0_SECRET_FIELD;

    const secret: string = secretObject[secretField];

    return verify(token, secret) as JwtToken;
}

/**
 * Generate an api gateway authorizer policy for authentication.
 * @param principalId An id of a user
 * @param resource Resources an user can access. Pass in '*' for all resources.
 * @param effect Allow or Deny.
 * @returns A policy for api gateway.
 */
function generatePolicy(
    principalId: string,
    resource: string,
    effect: string
): APIGatewayAuthorizerResult {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
    };
}

async function getAuth0Secret() {
    if (cachedSecret) return cachedSecret;

    const secretId = config.AUTH_0_SECRET_ID;

    const secretsManagerClient = new AWS.SecretsManager();

    const data = await secretsManagerClient
        .getSecretValue({
            SecretId: secretId,
        })
        .promise();

    cachedSecret = data.SecretString;

    return JSON.parse(cachedSecret);
}
