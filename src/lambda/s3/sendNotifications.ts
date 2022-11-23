import { S3Event, S3Handler } from 'aws-lambda';

export const handler: S3Handler = async (event: S3Event) => {
    for (const record of event.Records) {
        const key = record;

        console.log('Processing S3 item with key: ', key);
    }
};
