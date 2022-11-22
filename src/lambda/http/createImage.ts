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
const s3 = new AWS.S3();

const imagesTable = config.IMAGES_TABLE;
const bucketName = config.IMAGES_S3_BUCKET;
const urlExpiration = config.SIGNED_URL_EXPIRATION;

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
        timestamp,
        imagesUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
    };

    await docClient
        .put({
            TableName: imagesTable,
            Item: newImage,
        })
        .promise();

    const url: string = await getUploadUrl(imageId);
    
    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            newImage,
            uploadUrl: url
        }),
    };
};

/**
 * Get a pre-signed url of an S3 bucket.
 * @param imageId Id of an image.
 * @returns Pre-signed url.
 */
async function getUploadUrl(imageId: string): Promise<string> {
    return await s3.getSignedUrlPromise('putObject', {
        Bucket: bucketName,
        Key: imageId,
        Expires: urlExpiration
    });
}

