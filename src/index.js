//! iniciar localstack
//localstack start
//! crear un bucket
// aws s3 mb s3://exam-bucket --endpoint-url=http://localhost:4566
//! instalar dependencias
// npm install
//! compilar webpack
// npx webpack --config webpack.config.js
//! habilitar cors
// aws --endpoint-url=http://localhost:4566 s3api put-bucket-cors --bucket exam-bucket --cors-configuration file://src/cors.json

//--------------------------------------------------------------------------------
//! AWS code
//--------------------------------------------------------------------------------

const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

//const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
//const fs = require('fs');

// Configure the AWS SDK for S3
const client = new S3Client({
  endpoint: "http://127.0.0.1:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  forcePathStyle: true, // Needed for LocalStack
});

const bucketName = "exam-review";

// Upload file to S3
async function uploadFileBucket(fileName, textContent) {
  try {
    // Using the Upload class from AWS SDK v3 for managed uploads
    const upload = new Upload({
      client: client,
      params: {
        Bucket: bucketName,
        Key: `new/${fileName}`,
        Body: textContent,
      },
    });

    // Upload the file
    await upload.done();
    console.log(`File ${fileName} uploaded to new/${fileName}.`);

    await printItems();

    setTimeout(() => {
      printItems();
    }, 2000);

    // limpiar carpeta new
    setTimeout(() => {
      deleteFileBucket(fileName, `new`);
    }, 3000);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
}

// List objects in S3 bucket
async function listObjectsBucket() {
  try {
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    const data = await client.send(command);
    console.log("Objects in bucket:");
    console.log(data.Contents);

    //return data.Contents;

    if(!data.Contents || data.Contents.length === 0){
      return []
    }

    // Filtrar los objetos que tienen la ruta "processed/new/"
    const filterData = data.Contents.filter((item) =>
      item.Key.startsWith("processed/new/")
    );

    console.log("Filtered objects:");
    console.log(filterData);

    return filterData;
  } catch (error) {
    console.error("Error listing objects:", error);
  }
}

// Delete file from S3
async function deleteFileBucket(fileName, keyDelete = "processed/new") {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: `${keyDelete}/${fileName}`,
    });

    await client.send(command);
    console.log(`File ${keyDelete}/${fileName} deleted.`);
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}

//--------------------------------------------------------------------------------
//! html code with aws code
//--------------------------------------------------------------------------------

const file = document.getElementById("file");
const text = document.getElementById("text");
const btnSend = document.getElementById("btnSend");
let bucketFiles = [];
let bucketFilesMain = [];

async function deleteFile(fileName) {
  console.log("click btn delete", fileName);

  await deleteFileBucket(fileName);

  bucketFiles = bucketFiles.filter(
    (item) => item.Key.split("/")[2] !== fileName
  );

  printItems();
}

function createItem(fileName) {
  const tableBody = document.getElementById("table");

  const newRow = document.createElement("tr");
  const nameCell = document.createElement("td");
  nameCell.textContent = fileName;
  const btnCell = document.createElement("td");
  const btn = document.createElement("button");
  btn.classList = "btn btn-danger";
  btn.textContent = "Delete";
  btn.addEventListener("click", () => deleteFile(fileName));
  btnCell.appendChild(btn);
  newRow.appendChild(nameCell);
  newRow.appendChild(btnCell);
  tableBody.appendChild(newRow);
}

async function printItems() {
  bucketFiles = await listObjectsBucket();
  console.log(bucketFiles);

  document.getElementById("table").innerHTML = "";

  bucketFiles.forEach((file) => createItem(file.Key.split("/")[2]));
}

btnSend.addEventListener("click", async () => {
  const textContent = text.value;
  const fileUpload = file.files[0];

  if (fileUpload) {
    console.log(fileUpload);
    await uploadFileBucket(fileUpload.name, fileUpload);
    file.value = null;
  }

  if (textContent) {
    const fileName = `text-${Date.now()}.txt`;
    console.log(fileName);
    await uploadFileBucket(fileName, textContent);
    text.value = "";
  }
});

printItems();
