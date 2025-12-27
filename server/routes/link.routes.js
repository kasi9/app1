import express from 'express';

import { createLink, deleteLink, getLink, getLinks, getLinksByPagination, updateLink } from '../controllers/link.ctrl.js';

const linkRouter = express.Router();

linkRouter.post('/', createLink);
linkRouter.put('/:id', updateLink);
linkRouter.delete('/:id', deleteLink);

linkRouter.get('/:pageSize/:pageNo/:filterRules/:sortrules/:search', getLinksByPagination);
linkRouter.get('/:id', getLink);

export default linkRouter;
