import express from 'express';
import multer from "multer";

import  { 
    registerOrganization, createOrganization, updateOrganization, updateOrganizationLogo, deleteOrganization, createOrganizationsBulk
    , getOrganizations, getOrganization, getOrganizationLogo, validateRegister, validateOrganization, getOrganizationsByPagination 
} from '../controllers/organization.ctrl.js';
import { authorizeUser } from '../controllers/user.ctrl.js';

const organizationRouter = express.Router();

// 👇 use memory storage (no file is written to disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

organizationRouter.post('/register', validateRegister, registerOrganization);
organizationRouter.post('/', authorizeUser, validateOrganization, createOrganization);
organizationRouter.put('/:id', authorizeUser, updateOrganization);
organizationRouter.put('/logo/:id', upload.single("logo"), updateOrganizationLogo);
organizationRouter.delete('/:id', authorizeUser, deleteOrganization)
organizationRouter.post('/bulkinsert', createOrganizationsBulk);

organizationRouter.get('/', authorizeUser, getOrganizations);
organizationRouter.get('/:id', authorizeUser, getOrganization);
organizationRouter.get('/logo/:id', authorizeUser, getOrganizationLogo);
organizationRouter.get('/:pageSize/:pageNo/:filterRules/:sortrules/:search', authorizeUser, getOrganizationsByPagination);

export default organizationRouter;
