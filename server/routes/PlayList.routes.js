import express from 'express';

import { createPlayList, updatePlayList, deletePlayList, getPlayList, getPlayListsByPagination } from '../controllers/PlayList.controller.js';
import { authorizeUser } from '../controllers/user.ctrl.js';

const playListRouter = express.Router();

playListRouter.post('/', authorizeUser, createPlayList);
playListRouter.put('/:id', authorizeUser, updatePlayList);
playListRouter.delete('/:id', authorizeUser, deletePlayList);

playListRouter.get('/:pageSize/:pageNo/:filterRules/:sortrules/:search', authorizeUser, getPlayListsByPagination);
playListRouter.get('/:id', authorizeUser, getPlayList);

export default playListRouter;
