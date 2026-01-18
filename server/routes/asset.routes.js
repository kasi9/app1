import express from 'express';
import multer from "multer";
import { Storage } from "@google-cloud/storage";
import dotenv from 'dotenv';
import path from "path";
import crypto from "crypto";

import { createAsset, updateAsset, deleteAsset, getAsset, getAssetsByPagination } from '../controllers/asset.controller.js';
import { authorizeUser } from '../controllers/user.ctrl.js';

dotenv.config();

const assetRouter = express.Router();

const allowedMimeTypes = ["video/mp4", "audio/mpeg", "image/jpeg", "image/png", "application/pdf", "text/plain"
    , "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const allowedExt = [".mp4", ".mp3", ".jpg", ".jpeg", ".png", ".pdf", ".docx", ".txt"];

/*const storage = multer.diskStorage({ destination: 'uploads/', filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname) });
const upload = multer({ storage });*/

const upload = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: (1024 * 1024) * 250 }, // 100MB
    fileFilter(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (!allowedMimeTypes.includes(file.mimetype) || !allowedExt.includes(ext)) {
            cb(new Error("Only video/audio/image/pdf/text/docx allowed"));
        } else {
            cb(null, true);
        }
    }
});
const googleStorage = new Storage({ credentials: JSON.parse(process.env.GOOGLE_APP_CREDENTIAL_JSON), });
const bucket = googleStorage.bucket(process.env.BUCKET_NAME);

const googleUpload = async (req, res, next) => {

    try {
        if (!req.file) 
            return next();

        const safeName = crypto.randomBytes(16).toString("hex") + path.extname(req.file.originalname);
        const gcsFileName = `uploads/${Date.now()}-${safeName}`; //`uploads/${Date.now()}-${req.file.originalname}`;
        const file = bucket.file(gcsFileName);

        const stream = file.createWriteStream({ resumable: false, metadata: { contentType: req.file.mimetype }, });

        stream.on("error", (err) => next(err));

        stream.on("finish", async () => {
            req.gcsPath = gcsFileName;
            req.gcsUrl = `${process.env.FILE_STORAGE}/${bucket.name}/${gcsFileName}`;
          //  req.gcsUrl = `gs://${bucket.name}/${gcsFileName}`;
            req.body.filePath = `${gcsFileName}`;
            req.body.fileUrl = req.gcsUrl;
         //   await file.makePublic();

            next();
        });

        stream.end(req.file.buffer);
    } catch (err) {
        next(err);
    }
};

assetRouter.post('/', authorizeUser, upload.single("file"), googleUpload, createAsset);
//assetRouter.post('/', authorizeUser, upload.single("file"), createAsset);
assetRouter.put('/:id', authorizeUser, upload.single("file"), googleUpload, updateAsset);
assetRouter.delete('/:id', authorizeUser, /*upload.single("file"), googleUpload,*/ deleteAsset);
//assetRouter.delete('/:id', authorizeUser, upload.single("file"), deleteAsset);

assetRouter.get('/:pageSize/:pageNo/:filterRules/:sortrules/:search/:tags', authorizeUser, getAssetsByPagination);
assetRouter.get('/:id', authorizeUser, getAsset);

export default assetRouter;
