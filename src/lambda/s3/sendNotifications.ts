import { S3Event, S3Handler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { config } from '../../../config';

const docClient = new AWS.DynamoDB.DocumentClient();

const connectionsTable = config.CONNECTIONS_TABLE;
const stage = config.STAGE;
const apiId = process.env.API_ID;

const connectionParams = {
    apiVersion: "2022-11-23",
    endpoint: `${apiId}.execute-api.us-east-1.amazonaws.com/${stage}`
};

const apiGateway = new AWS.ApiGatewayManagementApi(connectionParams);

export const handler: S3Handler = async (event: S3Event) => {
    for (const record of event.Records) {
        const key = record.s3.object.key;

        console.log('Processing S3 item with key: ', key);

        const connections = await docClient.scan({
            TableName: connectionsTable
        }).promise();

        const payload: object = {
            apiId,
            imageId: key
        };

        for (const connection of connections.Items) {
            const connectionId = connection.id;
            await SendMessageToClient(connectionId, payload)
        }
    }
};

/**
 * Send a message to a websocket using APIGateway post method.
 * In the catch block, if a status code returned 410 then the connection was stale and need to be delete.
 * @param connectionId ID of a websocket connection.
 * @param payload Data to send to the websocket.
 */
async function SendMessageToClient(connectionId: string, payload: object): Promise<void> {
    try {
        console.log('Sending message to a connection ', connectionId);

        await apiGateway.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(payload)
        }).promise();
    } catch (e) {
        console.log('Failed to send notification.', JSON.stringify(e));

        if (e.statusCode === 410) {
            console.log('Stale connection!');

            await docClient.delete({
                TableName: connectionsTable,
                Key: {
                    id: connectionId
                }
            }).promise();
        }
    }
}
