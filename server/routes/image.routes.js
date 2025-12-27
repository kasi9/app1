import express from 'express';
import multer from "multer";

import { createImage, deleteImage, getImage, getImagesByPagination, updateImage } from '../controllers/image.ctrl.js';

const imageRouter = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

imageRouter.post('/', upload.single("image"), createImage);
imageRouter.put('/:id', updateImage);
imageRouter.delete('/:id', deleteImage);

imageRouter.get('/:pageSize/:pageNo/:filterRules/:sortrules/:search', getImagesByPagination);
imageRouter.get('/:id', getImage);

export default imageRouter;
