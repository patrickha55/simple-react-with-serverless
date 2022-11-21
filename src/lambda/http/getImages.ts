import {
    APIGatewayProxyHandler,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from 'aws-lambda';
import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import { config } from '../../../config';
import { isGroupExists } from '../../helper/isGroupExists';

const docClient = new AWS.DynamoDB.DocumentClient();

const imagesTable = config.IMAGES_TABLE;

export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const groupId: string = event.pathParameters.groupId;

    if (!groupId) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: "Group's id is required.",
            }),
        };
    }

    const validGroup: boolean = await isGroupExists(groupId);

    if (!validGroup)
        return {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Group does not exist.',
            }),
        };

    const images = await getGroupsImages(groupId);

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            items: images,
        }),
    };
};

/**
 * Get images of a group.
 * @param groupId Id of a group.
 * @returns Group's Images.
 */
async function getGroupsImages(groupId: String): Promise<object[]> {
    const result = await docClient
        .query({
            TableName: imagesTable,
            KeyConditionExpression: 'groupId = :groupId',
            ExpressionAttributeValues: {
                ':groupId': groupId,
            },
            ScanIndexForward: false,
        })
        .promise();

    return result.Items;
}
