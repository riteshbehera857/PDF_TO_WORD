import * as groupdocs_conversion_cloud from "groupdocs-conversion-cloud";
import * as groupdocs_editor_cloud from "groupdocs-editor-cloud";

import express, { NextFunction, Request, Response } from "express";

import { Buffer } from "buffer";
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

let editApi = groupdocs_editor_cloud.EditApi.fromKeys(clientId, clientSecret);
let fileApi = groupdocs_editor_cloud.FileApi.fromKeys(clientId, clientSecret);

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
      await editFile();
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

async function editFile() {
  const configuration = new groupdocs_editor_cloud.Configuration(
    clientId,
    clientSecret
  );

  let fileInfo = new groupdocs_editor_cloud.FileInfo();
  fileInfo.filePath = "src/sample.docx";

  let loadOptions = new groupdocs_editor_cloud.WordProcessingLoadOptions();
  loadOptions.fileInfo = fileInfo;
  loadOptions.outputPath = "src/edited_file.docx";

  let loadRequest = new groupdocs_editor_cloud.LoadRequest(loadOptions);
  let loadResult = await editApi.load(loadRequest);

  let downloadRequest = new groupdocs_editor_cloud.DownloadFileRequest(
    loadResult.htmlPath
  );
  let buf = await fileApi.downloadFile(downloadRequest);
  let htmlString = buf.toString("utf-8");

  htmlString = replaceClauses(htmlString);

  const htmlBuffer = Buffer.from(htmlString, "utf-8");

  let uploadRequest: groupdocs_conversion_cloud.UploadFileRequest =
    new groupdocs_editor_cloud.UploadFileRequest(
      loadResult.htmlPath,
      htmlBuffer
    ) as any;
  await fileApi.uploadFile(uploadRequest);

  // save html back to docx
  let saveOptions = new groupdocs_editor_cloud.WordProcessingSaveOptions();
  saveOptions.fileInfo = fileInfo;
  saveOptions.outputPath = "src/edited.docx";
  saveOptions.htmlPath = loadResult.htmlPath;
  saveOptions.resourcesPath = loadResult.resourcesPath;

  // create save request
  let saveRequest = new groupdocs_editor_cloud.SaveRequest(saveOptions);
  let saveResult = await editApi.save(saveRequest);

  await downloadUpdatedFile();
  console.log("Document edited: " + saveResult.path);
}

function replaceClauses(input: string) {
  // Define the regex pattern to match "1.1", "2.3.1", etc.
  const regex = /\d+(\.\d+)+/g;

  // Replace the matched pattern with "clause1", "clause2.3", etc.
  return input.replace(regex, (match: string) => {
    // Extract each number from the match
    const numbers = match.split(".").map(Number);

    // Generate the replacement string
    const replacement = numbers
      .map((num, index) => {
        if (index === 0) {
          return `clause${num}`;
        } else {
          return `.${num}`;
        }
      })
      .join("");

    return replacement;
  });
}

async function downloadUpdatedFile() {
  const configuration = new groupdocs_editor_cloud.Configuration(
    clientId,
    clientSecret
  );
  // initialize api
  var fileApi = groupdocs_editor_cloud.FileApi.fromConfig(configuration);

  // create file download request
  let request = new groupdocs_editor_cloud.DownloadFileRequest(
    "src/edited.docx",
    myStorage
  );

  // download file
  let response = await fileApi.downloadFile(request);

  // save image file in working directory
  fs.writeFile("src/edited.docx", response, "binary", function (err) {});
}

app.listen(3030, () => {
  console.log("Server running on port 3030");
});
