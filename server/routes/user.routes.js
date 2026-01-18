
import express from 'express';

import { userRolesMap, getToken, getPrivilegesByUserForm, authorizeUser } from '../controllers/user.ctrl.js';

const userRouter = express.Router();

userRouter.post('/', userRolesMap);
//userRouter.post('/bulkinsert', userBulkInsert);
userRouter.post('/login', getToken);
//userRouter.get('/login/:userName/:password', getToken);
//userRouter.get('/privileges', getPrivileges);
userRouter.post('/privilegesByUserForm', authorizeUser, getPrivilegesByUserForm);
//userRouter.get('/privilegesByUserForm/:userId/:formCode', getPrivilegesByUserForm);

export default userRouter;
