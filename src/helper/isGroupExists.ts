import * as AWS from 'aws-sdk';
import { config } from '../../config';

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = config.GROUPS_TABLE;

/**
 * Get images of a group.
 * @param groupId Id of a group.
 * @returns Group's Images.
 */
export const isGroupExists = async (groupId: string): Promise<boolean> => {
    const result = await docClient
        .get({
            TableName: groupsTable,
            Key: {
                id: groupId,
            },
        })
        .promise();

    return !!result.Item;
};
