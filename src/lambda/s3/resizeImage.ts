import { SNSEvent, SNSHandler, S3EventRecord } from "aws-lambda";
import * as AWS from "aws-sdk";
import { config } from "../../../config";
import Jimp from 'jimp';

export const handler: SNSHandler =async (event: SNSEvent) => {
    console.log('Processing SNS event ', JSON.stringify(event));

    for (const snsRecord of event.Records) {
        const s3EventStr = snsRecord.Sns.Message;
        console.log('Process s3 event', s3EventStr);

        const s3Event = JSON.parse(s3EventStr);

        for (const record of s3Event.Records) {
            await ProcessImage(record);
        }
    }
}

const bucketName = config.IMAGES_S3_BUCKET;
const thumnailBucketName = config.THUMBNAILS_S3_BUCKET;

const s3 = new AWS.S3({
    signatureVersion: 'v4'
});

async function ProcessImage(record: S3EventRecord): Promise<void> {
    const key = record.s3.object.key;

    const response = await s3.getObject({
        Bucket: bucketName,
        Key: key
    }).promise();

    const body = response.Body as string;

    const image = await Jimp.read(body);

    image.resize(150, Jimp.AUTO);

    const convertedBuffer = await image.getBufferAsync(`${Jimp.AUTO}`);

    await s3.putObject({
        Bucket: thumnailBucketName,
        Key: `${key}.jpeg`,
        Body: convertedBuffer
    }).promise();
}
