import { DynamoDBStreamEvent, DynamoDBStreamHandler } from "aws-lambda";

export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
    console.log(JSON.stringify(event));

    for (const record of event.Records) {
        console.log('Processing record ', JSON.stringify(record));
    }
}