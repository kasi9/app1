import express from 'express';
import multer from "multer";

import { createAudio, deleteAudio, getAudio, getAudiosByPagination, updateAudio } from '../controllers/audio.ctrl.js';

const audioRouter = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

audioRouter.post('/', upload.single("audio"), createAudio);
audioRouter.put('/:id', updateAudio);
audioRouter.delete('/:id', deleteAudio);

audioRouter.get('/:pageSize/:pageNo/:filterRules/:sortrules/:search', getAudiosByPagination);
audioRouter.get('/:id', getAudio);

export default audioRouter;
