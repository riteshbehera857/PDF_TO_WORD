import * as groupdocs_conversion_cloud from "groupdocs-conversion-cloud";

import express, { NextFunction, Request, Response } from "express";

import fs from "fs";
import morgan from "morgan";

const app = express();
app.use(morgan("dev"));

const clientId = "6463172d-5a3e-4cd4-ab14-d65d5cef2cb8";
const clientSecret = "2c6ce4727f91a2970480a3048a43de8b";
const myStorage = "";
let convertApi = groupdocs_conversion_cloud.ConvertApi.fromKeys(
  clientId,
  clientSecret
);

const sourceFile = "src/sample.pdf";

const config = new groupdocs_conversion_cloud.Configuration(
  clientId,
  clientSecret
);

config.apiBaseUrl = "https://api.groupdocs.cloud";

let settings = new groupdocs_conversion_cloud.ConvertSettings();

settings.filePath = sourceFile;
settings.format = "docx";
settings.outputPath = "src/sample.docx";

async function convertDocument() {
  try {
    console.log("convertApi", convertApi);
    let request = new groupdocs_conversion_cloud.ConvertDocumentRequest(
      settings
    );

    console.log("request", request);
    let response = await convertApi.convertDocument(request);
    await downloadFile();
    console.log("Document converted successfully: " + response[0].url);
  } catch (error) {
    console.log(error);
  }
}

async function downloadFile() {
  var fileApi = groupdocs_conversion_cloud.FileApi.fromConfig(config);

  // create download file request
  let request = new groupdocs_conversion_cloud.DownloadFileRequest(
    "src/sample.docx",
    myStorage
  );

  // download file
  let response = await fileApi.downloadFile(request);

  // save file in your working directory
  fs.writeFile("src/sample.docx", response, "binary", function (err) {});
}

app.post("/upload", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await uploadFile();

    res.status(201).send(response);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post(
  "/convert",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await convertDocument();
      res.status(201).send(response);
    } catch (err) {
      res.send(err);
    }
  }
);

async function uploadFile() {
  try {
    fs.readFile(sourceFile, async (err, fileStream) => {
      // construct FileApi
      console.log("fileStream", fileStream);
      var fileApi = groupdocs_conversion_cloud.FileApi.fromConfig(config);
      console.log("fileApi", fileApi);
      // create upload file request
      var request = new groupdocs_conversion_cloud.UploadFileRequest(
        "src/sample.pdf",
        fileStream,
        myStorage
      );
      console.log("request", request);
      // upload file
      await fileApi.uploadFile(request);
    });
  } catch (err) {
    console.log("err", err);
    return err;
  }
}

app.listen(3030, () => {
  console.log("Server running on port 3030");
});
