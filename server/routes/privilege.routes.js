
import express from 'express';
import { privilegeCreate, getPrivileges } from '../controllers/privilege.ctrl.js';

const privilegeRouter = new express.Router();

privilegeRouter.post('/bulkinsert', privilegeCreate);

privilegeRouter.get('/', getPrivileges);

export default privilegeRouter;
