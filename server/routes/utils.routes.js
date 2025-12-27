
import express from 'express';

import { createLog } from '../controllers/auditLog.ctrl.js';

const utilRouter = express.Router();

utilRouter.post('/', createLog);

export default utilRouter;
