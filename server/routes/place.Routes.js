import express from 'express';

import { createPlace, deletePlace, getPlace, getPlaces, getPlacesByPagination, updatePlace } from '../controllers/place.ctrl.js';

const placeRouter = express.Router();

placeRouter.post('/', createPlace);
placeRouter.put('/:id', updatePlace);
placeRouter.delete('/:id', deletePlace);

//placeRouter.get('/',  getPlaces);
placeRouter.get('/:pageSize/:pageNo/:filterRules/:sortrules/:search', getPlacesByPagination);
placeRouter.get('/:id', getPlace);

export default placeRouter;
