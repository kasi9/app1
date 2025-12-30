import mongoose from "mongoose";

import TagModel from '../models/tag.model.js';

export const getTags = async (request, response) => {

    try {

        const tags = await TagModel.distinct('title').lean();
        response.json({ success: true, responseType: 'msg', message: 'Tags fetched successfully.', data: tags, errorCode: '', errors: [], requestId: '' });

    } catch(err) {

        response.json({ success: false, responseType: 'err', message: err.message, data: null
            , errorCode: '', errors: [ err.message ], requestId: '' });

    }
}
