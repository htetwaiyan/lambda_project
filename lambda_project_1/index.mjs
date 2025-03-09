import AWS from "aws-sdk";
import { Readable } from "stream";
import csv from "csv-parser";

const S3 = new AWS.S3();
const DynamoDB = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = "<bucket name>"; // replace with your bucket name
const TABLE_NAME = "<dynamodb name>"; // replace with your dynamodb

export const handler = async (event) => {
  try {
    // Get file location from event
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    console.log(`Processing file: ${key} from bucket: ${bucket}`);

    // Get file from S3
    const s3Object = await S3.getObject({ Bucket: bucket, Key: key }).promise();
    const s3Stream = Readable.from(s3Object.Body);

    const records = [];

    // Parse CSV file
    await new Promise((resolve, reject) => {
      s3Stream
        .pipe(csv())
        .on("data", (row) => {
          records.push({ PutRequest: { Item: row } });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`Parsed ${records.length} records from CSV.`);

    // Batch write to DynamoDB
    const batchWrite = async (items) => {
      const params = { RequestItems: { [TABLE_NAME]: items } };
      await DynamoDB.batchWrite(params).promise();
    };

    // Dyamodb Allow write 25 count per 1 time
    for (let i = 0; i < records.length; i += 25) {
      await batchWrite(records.slice(i, i + 25));
    }

    console.log("Data stored in DynamoDB successfully.");
    return { statusCode: 200, body: "Success" };
  } catch (error) {
    console.error("Error processing file:", error);
    return { statusCode: 500, body: "Error processing file" };
  }
};