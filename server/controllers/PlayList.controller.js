import mongoose from 'mongoose';
import PlayList from '../models/PlayList.model.js';

import Counter from "../models/counter.model.js";

const validatePlaylist = (playlist) => {

    const errors = [];    
/*    if (!playlist.code?.trim()) {
        errors.push( "Play List Code should not be blank." );
    }

    if (!playlist.playListName?.trim()) {
        errors.push( "Play List Name should not be blank." );
    }*/

    return errors ;
}

export const createPlayList = async (request, response) => {

    let playListNew;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        playListNew = request.body;
        playListNew._id = null;
        playListNew.createdByUserId = request.user?.id;

        const errors = validatePlaylist(playListNew);
        if (errors.length>0)
            return response.status(200).json({ success: false, responseType: 'err', message: 'Play List failed to create.', data: playListNew
                , errorCode: '', errors: errors, requestId: '' });

        if (!playListNew.code) {
            const counter = await Counter.findOneAndUpdate( { name: "playListCode" }, { $inc: { seq: 1 } }, { new: true, upsert: true, session } );
            playListNew.code = counter.seq;
        }

        await PlayList.create([playListNew], { session });

        await session.commitTransaction();

        return response.status(200).json({ success: true, responseType: 'msg', message: 'Play List created successfully.', data: playListNew
            , errorCode: '', errors: [], requestId: '' });
    }
    catch(err){
        await session.abortTransaction();    
        return response.status(500).json({ success: false, responseType: 'err', message: 'Play List failed to create.', data: playListNew
            , errorCode: '', errors: [], requestId: '' });
    }
    finally {
        session.endSession();
    }   
}

export const updatePlayList = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const playListNew = { code: req.body.code, title: req.body.title, description: req.body.description, modifiedByUserId: req.user?.id };

        const addedAssets = req.body.assets.filter(a => a.updateType === "add").map(({ updateType, ...rest }) => rest);
        const deletedIds = req.body.assets.filter(a => a.updateType === "del").map(a => a._id);

        await PlayList.updateOne( { _id: id }, { $set: playListNew }, { session } );

        if (addedAssets.length) {
            await PlayList.updateOne( { _id: id }, { $addToSet: { assets: { $each: addedAssets } } }, { session } );
        }

        if (deletedIds.length) { 
            await PlayList.updateOne( { _id: id }, { $pull: { assets: { _id: { $in: deletedIds } } } }, { session } );
        }

        await session.commitTransaction();
        session.endSession();

        return res.json({ success: true, message: "Play List updated successfully" });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        return res.status(500).json({ success: false, message: err.message });
    }
};

export const deletePlayList = async (request, response) => {

    try{
        const { id } = request.params;
        await PlayList.findByIdAndDelete(id);

        return response.status(200).json({ success: true, responseType: 'msg', message: 'Play List deleted successfully.', data: null
            , errorCode: '', errors: [], requestId: '' });
    }
    catch(err){
        return response.status(200).json({ success: false, responseType: 'err', message: 'Play List failed to delete.', data: null
            , errorCode: '', errors: [], requestId: '' });
    }
}

export const getPlayLists = async (request, response) => {

    try {
        const playLists = await PlayList.find( {} );
        return response.status(200).json({ success: true, responseType: 'msg', message: 'Play lists fetched successfully.', data: playLists, errorCode: '', errors: [], requestId: '' });
    }
    catch(err){
        return response.status(200).json({ success: false, responseType: 'msg', message: 'Play list failed to fetch.', data: null
            , errorCode: '', errors: [err.message], requestId: '' });
    }
}

export const getPlayList = async (request, response) => {
  
    try {

        const { id } = request.params ;

        const playList = await PlayList.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            { $lookup: { from: "assets", let: { assetIds: "$assets._id" }, pipeline: [{ $match: { $expr: { $in: ["$_id", "$$assetIds"] } } },
            { $project: 
                { _id: 1, code: 1, name: 1, title: 1, isUploaded: 1, assetType: 1, tags: 1
                , filePath: {
                    $cond: { if: "$isUploaded", then: { $concat: [ process.env.FILE_STORAGE, "/", process.env.BUCKET_NAME, "/", "$filePath" ] }, else: "$filePath" } }
                    }
                    }
                ],
                as: "assetDetails"
                }
            },
            { $group: { _id: "$_id", tenantId: { $first: "$tenantId" }, code: { $first: "$code" }, title: { $first: "$title" }, description: { $first: "$description" }
                , assets: { $first: "$assetDetails" } }}
        ]);

/*      const playList = await PlayList.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        { $lookup: { from: "assets", localField: "assets._id", foreignField: "_id", as: "assetDetails"} },
        { $unwind: { path: "$assetDetails", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$_id", tenantId: { $first: "$tenantId" }, code: { $first: "$code" }, playListName: { $first: "$playListName" }, title: { $first: "$title" }
            , description: { $first: "$description"}, assets: { $push: "$assetDetails" } }}
      ]);*/

      return response.status(200).json({ success: true, responseType: 'msg', message: 'Play list fetched successfully.', data: playList[0] ?? null, errorCode: '', errors: [], requestId: '' });
    }
    catch(err) {
        return response.status(200).json({ success: false, responseType: 'err', message: 'Play list failed to fetched.', data: playList[0] ?? null
          , errorCode: '', errors: [err.message], requestId: '' });
    }
}

export const getPlayListsByPagination = async (req, res) => {

    try {

        const { pageSize = 10, pageNo = 1, filterRules, sortrules, search } = req.params;

        let filterOr = {};

        if (search && search !== "_") {
          filterOr = {
            $or: [
                { code: { $regex: search, $options: "i" } },
                { title: { $regex: search, $options: "i" } },
            ],
          };
        }

        const sortRules = sortrules ? JSON.parse(sortrules) : [];
        const sortObj = {};
        sortRules.forEach((rule) => {
            sortObj[rule.field] = rule.order === "asc" ? 1 : -1;
        });

        const filterRules2 = filterRules ? JSON.parse(filterRules) : [];
        const filterAnd = {};
        filterRules2.forEach((rule) => {
            filterAnd[rule.field] = { $regex: rule.value, $options: "i" };
        });

        const conditions = [];

        if (Object.keys(filterAnd).length) {
            conditions.push(filterAnd);
        }

        if (Object.keys(filterOr).length) {
            conditions.push(filterOr);
        }

        const filter = conditions.length ? { $and: conditions } : {};

/*        const exprNotEqual = { $expr: { $ne: ["$_id", "$parentId"] } };

        const filter = {
            $and: [ 
                ...(Object.keys(filterAnd).length ? [filterAnd] : []), 
                ...(Object.keys(filterOr).length ? [filterOr] : []),
            ],
        };*/

      const pipeline = [
          { $match: filter },
          { $project: { _id: 1, code: 1, title: 1}},
          ...(Object.keys(sortObj).length ? [{ $sort: sortObj }] : [{ $sort: { createdDate: -1 } }]),
          { $skip: (pageNo - 1) * parseInt(pageSize) },
          { $limit: parseInt(pageSize) },
        ];

        const [data, totalRows] = await Promise.all([
            PlayList.aggregate(pipeline),
            PlayList.countDocuments(filter),
        ]);

        return res.status(200).json({ success: true, responseType: 'msg', message: 'Play Lists fetched successfully.'
            , data: { result: data, totalRows, totalPages: Math.ceil(totalRows / pageSize), }
            , errorCode: '', errors: [], requestId: '' });
    } catch (error) {

        return res.status(200).json({ success: false, responseType: 'err', message: 'Play Lists failed to fetch.', data: null
            , errorCode: '', errors: [ error.message ], requestId: '' });
    }
};
