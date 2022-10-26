const express = require("express");
const routers = express.Router();
const { exec } = require("child_process");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const libre = require("libreoffice-convert");
// const toPdf = require("office-to-pdf");
const { PDFNet } = require("@pdftron/pdfnet-node");
const docxConverter = require("docx-pdf");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const docsToPDF = (req, file, callback) => {
  let ext = path.extname(file.originalname);

  console.log(ext);

  if (ext !== ".docx" && ext !== ".doc") {
    return callback("this is not supported");
  }

  callback(null, true);
};

const docxToPDF = multer({
  storage: storage,
  fileFilter: docsToPDF,
});

const pdfToWord = async (path, wordPath) => {
  try {
    // Optionally convert only the first page
    await PDFNet.addResourceSearchPath("./lib/");
    // check if the module is available
    if (!(await PDFNet.StructuredOutputModule.isModuleAvailable())) {
      console.log("not available");
      return;
    }
    // Requires the Structured Output module
    await PDFNet.Convert.fileToWord(path, wordPath);
  } catch (err) {
    console.log(err);
  }
};

const wordToPdf = async (filename) => {
  try {
    // perform the conversion with no optional parameters
    const buf = await PDFNet.Convert.office2PDFBuffer(filename);

    // end with a PDFDoc (the conversion destination)
    const doc = await PDFNet.PDFDoc.createFromBuffer(buf);
    console.log("dpoc", doc);
  } catch (err) {
    console.log(err);
  }
};

routers.get("/down", (req, res) => {
  res.send("ok");
});

const pdfToDocxFilter = (req, file, callback) => {
  var ext = path.extname(file.originalname);

  if (ext !== ".pdf") {
    return callback("not supported");
  }
  callback(null, true);
};

const pdfToDocx = multer({
  storage: storage,
  fileFilter: pdfToDocxFilter,
});

routers.post("/fileUpload", docxToPDF.single("file"), async (req, res) => {
  try {
    let path = `./${req.file.path}`;
    let pdfPath = path.slice(0, path.length - 5) + ".pdf";
    console.log("path", path, pdfPath);

    await docxConverter(path, pdfPath, function (err, result) {
      if (err) {
        console.log(err);
      }
      console.log("result" + result);
      let pdfBuffer = fs.readFileSync(pdfPath);
      res.send(pdfBuffer);
    });

    // if (req.file) {
    //   const file = fs.readFileSync(req.file.path);
    //   let outputFilePath = Date.now() + "output.pdf";
    //   libre.convert(file, ".pdf", undefined, (err, done) => {
    //     if (err) {
    //       fs.unlinkSync(req.file.path);
    //       fs.unlinkSync(outputFilePath);
    //       res.send("some error has taken in convertion");
    //     }
    //     try {
    //       fs.writeFileSync(`./uploads/${outputFilePath}`, done);
    //       console.log({ outputFilePath });
    //     } catch (err) {
    //       console.log({ err });
    //     }
    //     res.download(`./uploads/${outputFilePath}`, (err, done) => {
    //       if (err) {
    //         console.log({ err });
    //         fs.unlinkSync(req.file.path);
    //         fs.unlinkSync(outputFilePath);
    //         res.send("some error has taken in download ");
    //       }
    //       fs.unlinkSync(req.file.path);
    //       fs.unlinkSync(`./uploads/${outputFilePath}`);
    //     });
    //   });
    // }
  } catch (err) {
    console.log(err);
  }
});

// routers.post("/officetopdf", pdfToDocx.single("file"), async (req, res) => {
//   try {
//     //   word to pdf
//     let path = `./${req.file.path}`;
//     var wordBuffer = fs.readFileSync(path);
//     console.log("wordBuffer", wordBuffer);
//     var pdfBuffer = await toPdf(wordBuffer);
//     console.log("pdfBuffer", pdfBuffer);
//     // return res.status(200).json({
//     //     success: true,
//     //     file : pdfBuffer,
//     //     message: 'your request has been submitted'
//     // })
//     res.send(pdfBuffer);
//     // converter.generatePdf(req.file.filename, function(err, result) {
//     //     console.log(err)
//     //     if (result?.status === 0) {
//     //         console.log('Output File located at ' + result.outputFile);
//     //     }
//     // });
//   } catch (err) {
//     console.log(err);
//   }
// });

routers.post("/officetopdf", pdfToDocx.single("file"), async (req, res) => {
  try {
    //   word to pdf
    let path = `./${req.file.path}`;
    let wordPath = path.slice(0, path.length - 3) + "docx";
    console.log("path", path, wordPath);

    await PDFNet.runWithCleanup(
      () => pdfToWord(path, wordPath),
      "demo:1660193557355:7a3bd8a80300000000e314f29b18e39c70cc799967771ca72cbf6f7964"
    );
    let wordBuffer = fs.readFileSync(wordPath);
    // var wordBuffer = fs.readFileSync(path);
    // console.log("wordBuffer", wordBuffer);
    // var pdfBuffer = await toPdf(wordBuffer);
    // console.log("pdfBuffer", pdfBuffer);
    // // return res.status(200).json({
    // //     success: true,
    // //     file : pdfBuffer,
    // //     message: 'your request has been submitted'
    // // })
    res.send(wordBuffer);
    // // converter.generatePdf(req.file.filename, function(err, result) {
    // //     console.log(err)
    // //     if (result?.status === 0) {
    // //         console.log('Output File located at ' + result.outputFile);
    // //     }
    // // });
  } catch (err) {
    console.log(err);
  }
});

const imageFilter = (req, file, cb) => {
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error("only .png .jpg .jpeg is allowed"));
  }
};

let upload = multer({ storage: storage, fileFilter: imageFilter });

routers.post("/jpgToPdf", upload.array("files", 100), (req, res) => {
  if (req.files) {
    console.log("files[0].path");
  }
  console.log(req.body);

  // let output = Date.now() + "output.jpg"
  // upload(req,res,(err) => {
  //     if(err){
  //         console.log("Error in uploading file")
  //     }
  //     else {
  //         console.log(req.file.path)
  //       }
  //       exec(`magick convert -scale 10% -scale 1000% ${req.file.path} ${output}`,(err,stdout,stderr)=> {
  //       if(err){
  //           console.log("Error takes place in processing image")
  //       }
  //       else{
  //           res.download(output,(err) => {
  //             console.log(err);
  //           })
  //       }})
  // })
});

module.exports = routers;
