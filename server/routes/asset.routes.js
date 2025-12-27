import express from 'express';
import multer from "multer";
import { Storage } from "@google-cloud/storage";
import dotenv from 'dotenv';

import { createAsset, updateAsset, deleteAsset, getAsset, getAssetsByPagination } from '../controllers/asset.controller.js';
import { authorizeUser } from '../controllers/user.ctrl.js';

dotenv.config();

const assetRouter = express.Router();

const upload = multer({ storage: multer.memoryStorage() });
/*const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });*/

const googleStorage = new Storage({ credentials: JSON.parse(process.env.GOOGLE_APP_CREDENTIAL_JSON), });

const bucket = googleStorage.bucket(process.env.BUCKET_NAME);

const googleUpload = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const gcsFileName = `uploads/${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(gcsFileName);

    const stream = file.createWriteStream({
      metadata: { contentType: req.file.mimetype },
    });

    stream.on("error", (err) => next(err));

    stream.on("finish", async () => {
      // Optional: make public or generate URL
      // await file.makePublic();
      req.gcsPath = gcsFileName;
      req.gcsUrl = `gs://${bucket.name}/${gcsFileName}`;
            req.body.filePath = `${gcsFileName}`;
//      req.body.filePath = `${process.env.FILE_STORAGE}/${bucket.name}/${gcsFileName}`;
      // or public URL:
      // req.publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;

      next();
    });

    stream.end(req.file.buffer);
  } catch (err) {
    next(err);
  }
};

assetRouter.post('/', authorizeUser, upload.single("audio"), googleUpload, createAsset);
//assetRouter.post('/', authorizeUser, upload.single("audio"), createAsset);
assetRouter.put('/:id', authorizeUser, upload.single("audio"), updateAsset);
assetRouter.delete('/:id', authorizeUser, upload.single("audio"), googleUpload, deleteAsset);
//assetRouter.delete('/:id', authorizeUser, upload.single("audio"), deleteAsset);

assetRouter.get('/:pageSize/:pageNo/:filterRules/:sortrules/:search/:tags', authorizeUser, getAssetsByPagination);
assetRouter.get('/:id', authorizeUser, getAsset);

export default assetRouter;
