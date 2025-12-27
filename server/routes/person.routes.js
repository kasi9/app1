
import express from 'express';
import multer from "multer";

import { createPerson, updatePerson, updateUserAvatar, deletePerson, createPersonsBulk, getPersons, getPerson, getUserAvatar, validatePerson, getPersonsByPagination }  from '../controllers/person.ctrl.js';
import { authorizeUser } from '../controllers/user.ctrl.js';

const personRouter = express.Router();

// 👇 use memory storage (no file is written to disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

personRouter.post('/', authorizeUser, validatePerson, createPerson);
personRouter.put('/:id', authorizeUser, updatePerson);
personRouter.put('/avatar/:id', upload.single("avatar"), updateUserAvatar);
personRouter.delete('/:id', authorizeUser, deletePerson);
personRouter.post('/bulkinsert', authorizeUser, createPersonsBulk);

personRouter.get('/', authorizeUser, getPersons);
personRouter.get('/:id', authorizeUser, getPerson);
personRouter.get('/avatar/:id', authorizeUser, getUserAvatar);
personRouter.get('/:pageSize/:pageNo/:filterRules/:sortrules/:search', authorizeUser, getPersonsByPagination);

export default personRouter;