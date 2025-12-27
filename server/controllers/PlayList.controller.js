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
      playListNew.createdByUserId = request.user?.id;

      const errors = validatePlaylist(playListNew);
      if (errors.length>0)
          return response.status(200).json({ success: false, responseType: 'err', message: 'Play List failed to create.', data: playListNew
            , errorCode: '', errors: errors, requestId: '' });

if (!playListNew.code) {
const counter = await Counter.findOneAndUpdate(
  { name: "playListCode" },
  { $inc: { seq: 1 } },
  { new: true, upsert: true }
);
playListNew.code = counter.seq;
}            
      await PlayList.create(playListNew);
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

export const updatePlayList = async (request, response) => {

    let playListNew ;

    try {

        playListNew = { code: request.body.code, title: request.body.title, description: request.body.description
            , modifiedByUserId: request.user?.id } ;

        const { id } = request.params ;
        const addedAssets = request.body.assets.filter(a => a.updateType === "add");
        const deletedIds = request.body.assets.filter(a => a.updateType === "del").map(a => a._id);

        const errors = validatePlaylist(playListNew);
        if (errors.length>0)
            return response.status(200).json({ success: false, responseType: 'err', message: 'Play List failed to create.', data: playListNew
              , errorCode: '', errors: errors, requestId: '' });

        await PlayList.findByIdAndUpdate(id, 
            { $set: playListNew }, 
            {new: true});

        await PlayList.findByIdAndUpdate(id, 
            { $push: { assets: { $each: addedAssets }}},
            {new: true});

        await PlayList.updateOne({ _id: id }, { $pull: { assets: { _id: { $in: deletedIds } } } });        

        return response.status(200).json({ success: true, responseType: 'msg', message: 'Play List updated successfully.', data: null
            , errorCode: '', errors: [], requestId: '' });

    } catch(err){

        return response.status(200).json({ success: false, responseType: 'err', message: 'Play List failed to udpate.', data: null
            , errorCode: '', errors: [], requestId: '' });

    }
}

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

  {
    $lookup: {
      from: "assets",
      let: { assetIds: "$assets._id" },
      pipeline: [
        { $match: { $expr: { $in: ["$_id", "$$assetIds"] } } },

        // 👉 Pick specific fields + computed field
        {
          $project: {
            _id: 1,
            code: 1,
            name: 1,
            title: 1,
            isUploaded: 1,
            assetType: 1,
            tags: 1,
            
            filePath: {
              $cond: {
                if: "$isUploaded",
                then: {
                  $concat: [
                    process.env.FILE_STORAGE,
                    "/",
                    process.env.BUCKET_NAME,
                    "/",
                    "$filePath"
                  ]
                },
                else: "$filePath"
              }
            }
          }
        }
      ],
      as: "assetDetails"
    }
  },

  {
    $group: {
      _id: "$_id",
      tenantId: { $first: "$tenantId" },
      code: { $first: "$code" },
      title: { $first: "$title" },
      description: { $first: "$description" },
      assets: { $first: "$assetDetails" } // already filtered + computed
    }
  }
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
              { audioName: { $regex: search, $options: "i" } },
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

        const exprNotEqual = { $expr: { $ne: ["$_id", "$parentId"] } };

        const filter = {
          $and: [
            exprNotEqual,
            ...(Object.keys(filterAnd).length ? [filterAnd] : []),
            ...(Object.keys(filterOr).length ? [filterOr] : []),
          ],
        };


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
            , errorCode: '', errors: [ err.message ], requestId: '' });

    }
};
