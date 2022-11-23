import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { config } from "../../../config";

const docClient = new AWS.DynamoDB.DocumentClient();

const connectionsTable = config.CONNECTIONS_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const connectionId = event.requestContext.connectionId;
    const key = {
        id: connectionId
    }

    await docClient.delete({
        TableName: connectionsTable,
        Key: key
    }).promise();

    return {
        statusCode: 200,
        body: ''
    }
}