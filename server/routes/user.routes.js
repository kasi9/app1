
import express from 'express';

import { userRolesMap, userBulkInsert, getToken, getPrivileges, getPrivilegesByUserForm } from '../controllers/user.ctrl.js';

const userRouter = express.Router();

userRouter.post('/', userRolesMap);
userRouter.post('/bulkinsert', userBulkInsert);
userRouter.get('/login/:userName', getToken);
userRouter.get('/privileges', getPrivileges);
userRouter.get('/privilegesByUserForm/:userId/:formCode', getPrivilegesByUserForm);

export default userRouter;
