import {
    APIGatewayProxyHandler,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from 'aws-lambda';
import { v4 as uniqueId } from 'uuid';
import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import { config } from '../../../config';

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = config.GROUPS_TABLE;

/**
 * A lambda function for creating a new group.
 * @param event
 */
export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const itemId = uniqueId();

    console.debug('ItemId: ', itemId);

    if (!itemId) {
        return {
            statusCode: 500,
            headers: {
    
            },
            body: JSON.stringify({
                error: 'Something went wrong, please try again later.'
            })
        };
    }

    if (!event.body) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Missing required fields.'
            })
        }
    }

    const parsedBody = JSON.parse(event.body);

    const newItem = {
        id: itemId,
        ...parsedBody
    };

    await docClient.put({
        TableName: groupsTable,
        Item: newItem
    }).promise();

    // return the object result (statusCode, headers(cors), body)

    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            newItem
        })
    };
};
