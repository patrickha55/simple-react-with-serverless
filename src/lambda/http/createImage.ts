import {
    APIGatewayProxyHandler,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from 'aws-lambda';
import { v4 as uniqueId } from 'uuid';
import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import { config } from '../../../config';
import { isGroupExists } from '../../helper/isGroupExists';

const docClient = new AWS.DynamoDB.DocumentClient();

const imagesTable = config.IMAGES_TABLE;

/**
 * A lambda function for creating a new image.
 * @param event
 */
export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const imageId = uniqueId();

    const parsedBody = JSON.parse(event.body);

    const validGroupId: boolean = await isGroupExists(parsedBody.groupId);

    if (!validGroupId) {
        return {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Group does not exist.' }),
        };
    }

    const timestamp = new Date().toISOString();

    const newImage = {
        imageId,
        ...parsedBody,
        timestamp
    };

    await docClient
        .put({
            TableName: imagesTable,
            Item: newImage,
        })
        .promise();

    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            newImage,
        }),
    };
};
