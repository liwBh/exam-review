const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configurar S3 Client apuntando a LocalStack
const s3 = new S3Client({
  //endpoint: 'http://host.docker.internal:4566',
  endpoint: "http://172.17.0.2:4566",
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
  forcePathStyle: true, // Needed for LocalStack
});

exports.handler = async (event) => {
  try {
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;
    const folderDest = "processed/";

    console.log("Bucket:", bucket);
    console.log("Key:", key);

    const getObjectParams = {
      Bucket: bucket,
      Key: key
    };

    const fileData = await s3.send(new GetObjectCommand(getObjectParams));

    const body = Buffer.from(await fileData.Body.transformToByteArray()).toString('utf8');
    console.log("File content:", body);
    const lines = body.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const lineKey = `${folderDest}${key}-line-${i + 1}.txt`;
      console.log(lineKey);
      const putObjectParams = {
        Bucket: bucket,
        Key: lineKey,
        Body: lines[i],
      };
      await s3.send(new PutObjectCommand(putObjectParams));
    }

    console.log("File processed successfully");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "File processed successfully" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error processing file", error: error.message }),
    };
  }
};