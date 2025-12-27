
import express from 'express';
import { objectTypeBulkInsert } from '../controllers/objectType.ctrl.js';

const objectTypeRouter = express.Router();

objectTypeRouter.post('/bulkinsert', objectTypeBulkInsert);

export default objectTypeRouter;
