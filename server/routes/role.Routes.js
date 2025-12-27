
import express from 'express';
import multer from "multer";

import { validateRole, createRole, updateRoleIcon, deleteRole, createRolesBulk, getRoles, getRole, updateRole, getRolesByPagination, getRoleIcon } from '../controllers/role.ctrl.js';
import { authorizeUser } from '../controllers/user.ctrl.js'; '../controllers/user.ctrl.js';

const router = express.Router();

// 👇 use memory storage (no file is written to disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/:pageSize/:pageNo/:filterRules/:sortrules/:search', authorizeUser, getRolesByPagination);
router.post('/', authorizeUser, validateRole, createRole);
router.put('/:id', authorizeUser, updateRole);
router.put('/icon/:id', authorizeUser, upload.single("icon"), updateRoleIcon);
router.delete('/:id', authorizeUser, deleteRole);
router.post('/bulkinsert', createRolesBulk);

router.get('/', authorizeUser, getRoles);
router.get('/:id', authorizeUser, getRole);
router.get('/icon/:id', authorizeUser, getRoleIcon);

export default router;
