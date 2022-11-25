import { APIGatewayAuthorizerHandler, APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from "aws-lambda";

export const handler: APIGatewayAuthorizerHandler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
    try {
        verifyToken(event.authorizationToken);
    
        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: '*'
                    }
                ]
            }
        }
    } catch (error) {
        console.error(JSON.stringify(error));

        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: '*'
                    }
                ]
            }
        }
    }
}

function verifyToken(authHeader: string): void {
    if (!authHeader) throw new Error('No authorization header.');

    if (!authHeader.startsWith('Bearer ')) throw new Error('Invalid authorization header.');

    const split = authHeader.split(' ');

    const token = split[1];

    if (!token.includes('123')) throw new Error('Invalid authorization token.');
}
