
import express from 'express';

import { getYouTubeVideos, saveYouTubeVideo, deleteYouTubeVideo, getYouTubeVideo, updateYouTubeVideo } from '../controllers/youtube.ctrl.js';

const videoRouter = express.Router();

videoRouter.post('/', saveYouTubeVideo);
videoRouter.put('/:id', updateYouTubeVideo);
videoRouter.delete('/:id', deleteYouTubeVideo);
videoRouter.get('/', getYouTubeVideos);
videoRouter.get('/:id', getYouTubeVideo);

export default videoRouter;
