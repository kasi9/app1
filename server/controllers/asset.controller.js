import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Storage } from "@google-cloud/storage";
import dotenv from 'dotenv';

import Asset from '../models/asset.model.js';
import TagModel from '../models/tag.model.js';
import Counter from "../models/counter.model.js";

dotenv.config();

//const storage = new Storage();
const storage = new Storage({ credentials: JSON.parse(process.env.GOOGLE_APP_CREDENTIAL_JSON), });

const BUCKET_NAME = process.env.BUCKET_NAME;

const deleteFileIfExistsGCS = async (filePath) => {
    if (!filePath) return;

    const cleanPath = filePath.replace(/^\/+/, "");
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(cleanPath);

    try {
        const [exists] = await file.exists();

        if (!exists) {
            console.log("File not found in bucket:", cleanPath);
            return;
        }

        await file.delete();
        console.log("Deleted from GCS:", cleanPath);
    } catch (err) {
        console.error("Error deleting from GCS:", err.message);
  }
};

const validateAsset = (asset) => {

    const errors = [];

    if (!["video", "youTube", "audio", "image", "pdf", "gmap", "webLink","text","doc"].includes(asset.assetType)) {
        errors.push( "Asset Type should be Video / YouTube / Audio / Image / PDF / Google Map / Web Link only." );
    }
    
/*    if (!asset.code?.trim()) {
        errors.push( "Asset Code should not be blank." );
    }*/

    if ( ["video", "youTube", "audio", "image", "pdf", "webLink"].includes(asset.assetType)  && (asset.filePath?.trim().length ?? 0) == 0) {

        errors.push( "Source should be selected." );
        
        if (typeof asset.filePath !== "string") {
              errors.push( "Source should be selected." );
        }
    }

    if (asset.assetType === "gmap") {
        const lat = Number(asset.lat);
        const lng = Number(asset.lng);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            errors.push({ error: "Latitude must be between -90 and 90, and Longitude must be between -180 and 180." });
        }
    }

    return errors ;
}

export const createAsset = async (request, response) => {

    const parseJsonSafely = (value, fallback = []) => {
        try { return JSON.parse(value); }
        catch { return fallback; }
    };

    const segments = parseJsonSafely(request.body.segments);
    const tags = parseJsonSafely(request.body.tags);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const data = { ...request.body, filePath: request.body.filePath || null  
            , tenantId: request.user?.tenantId, organizationId: request.user?.organizationId, createdByUserId: request.user?.id
            , segments: segments, tags: tags} ;

        const assetErrors = validateAsset(data)
        if (assetErrors.length>0) {
            return response.status(200).json({ success: false, responseType: 'err', message: 'Failed to create Asset', data: { data: request.body, user: request.user}
                , errorCode: '', errors: assetErrors, requestId: '' });
        };

        if (!data.code) {
            const counter = await Counter.findOneAndUpdate( { name: "assetCode" }, { $inc: { seq: 1 } }, { new: true, upsert: true } );
            data.code = counter.seq;
        }

        const assetNew = new Asset(data);
        await assetNew.save({ session });
//        const assetNew = await Asset.create(data, {session});

        for (const tag of data.tags) {
            await TagModel.updateOne({ title: tag }, { $setOnInsert: { tenantId: data.tenantId, title: tag } }, { upsert: true, session });
        }

        await session.commitTransaction();

        assetNew.filePath = assetNew.isUploaded ? process.env.FILE_STORAGE +"/"+ process.env.BUCKET_NAME +"/"+ assetNew.filePath : assetNew.filePath ;
        return response.status(200).json({ success: true, responseType: 'msg', message: 'Asset created successfully.', data: assetNew, errorCode: '', errors: [], requestId: '' });
    }
    catch (err){
        await session.abortTransaction();      

        return response.status(200).json({ success: false, responseType: 'err', message: 'Failed to create Asset', data: { data: request.body, user: request.user}
          , errorCode: '', errors: [err.message], requestId: '' });

    } 
    finally {
        session.endSession();
    }    
}

export const updateAsset = async (request, response) => {

    let assetUpdated;

    try {
        const parseJsonSafely = (value, fallback = []) => {
        try { return JSON.parse(value); } catch { return fallback; } };

        const segments = parseJsonSafely(request.body.segments);
        const tags = parseJsonSafely(request.body.tags);

        const data = { ...request.body, tenantId: request.user?.tenantId, organizationId: request.user?.organizationId, modifiedByUserId: request.user?.id
            , segments: segments, tags: tags,
        } ;

        const assetErrors = validateAsset(data)
        if (assetErrors.length>0) {
            return response.status(200).json({ success: false, responseType: 'err', message: 'Failed to create Asset', data: { data: request.body, user: request.user}
                , errorCode: '', errors: assetErrors, requestId: '' });
        };

        const { id } = request.params ;
        const assetOld = await Asset.findById(id);
        if (!assetOld) 
            return response.status(200).json({ success: false, responseType: 'err', message: 'Asset not exists to update', data: { data: request.body, user: request.user}
                , errorCode: '', errors: assetErrors, requestId: '' });

        if (request.file && assetOld.filePath) {
            await deleteFileIfExists(assetOld.filePath);

            assetUpdated = await Asset.findByIdAndUpdate(id, 
                { $set: { assetType: data.assetType, code: data.code, title: data.title, description: data.description, filePath: request.file.filename, modifiedByUserId: data.modifiedByUserId } }, 
                {new: true});
        }
        else {
            assetUpdated = await Asset.findByIdAndUpdate(id, 
                { $set: { assetType: data.assetType, code: data.code, title: data.title, description: data.description, modifiedByUserId: data.modifiedByUserId
                    , segments: data.segments, tags: data.tags,
                } }, 
                {new: true});
        }

        for (const tag of data.tags) {
            await TagModel.updateOne({ title: tag }, { $setOnInsert: { tenantId: data.tenantId, title: tag } }, { upsert: true });
        }


        response.json({ success: true, responseType: 'msg', message: 'Asset updated successfully.', data: assetUpdated, errorCode: '', errors: [], requestId: '' });

    }
    catch (err) {    

        return response.status(500).json({ success: false, responseType: 'err', message: 'Failed to update Asset', data: { data: request.body, user: request.user}
            , errorCode: '', errors: [err.message], requestId: '' });

    }
}

export const deleteAsset = async (request, response) => {

    try {
        const { id } = request.params ;
        const asset = await Asset.findById(id);
        if (!asset) 
            return response.status(404).json({ status: false, data: null, message: "Asset not found" });

        if (asset?.filePath) { }
        await deleteFileIfExistsGCS(asset.filePath);
//        await deleteFileIfExists(asset.filePath);
        await Asset.findByIdAndDelete(id);

        response.json({ success: true, responseType: 'msg', message: 'Asset deleted successfully.', data: asset, errorCode: '', errors: [], requestId: '' });
    }
    catch (err) {
        return response.status(500).json({ success: false, responseType: 'err', message: 'Failed to update Asset', data: asset, errorCode: '', errors: [], requestId: '' });
    }
}

const deleteFileIfExists = (filePath) => {
    if (!filePath) return;

    const fullPath = path.join("uploads", filePath);

    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log("Deleted:", fullPath);
    }
};

/*export const getAssets = async (request, response) => {
    const assets = await Asset.find( {} );
    return response.json(assets);
}*/

export const getAsset = async (request, response) => {

    try {

        const { id } = request.params ;
        const asset = await Asset.findById(id).lean();
        if (asset && asset.isUploaded) 
            asset.filePath = `${process.env.FILE_STORAGE}/${BUCKET_NAME}/${asset.filePath}`;

        response.json({ success: true, responseType: 'msg', message: 'Asset fetched successfully.', data: asset, errorCode: '', errors: [], requestId: '' });

    } catch(err) {

        response.json({ success: false, responseType: 'err', message: 'Asset failed to fetch.', data: null
            , errorCode: '', errors: [ err.message ], requestId: '' });

    }
}

export const getAssetsByPagination = async (req, res) => {

    let hasFilter = false ;

    if (parseInt(req.params.pageNo) === 0) {
        return getAssetsByPagination2(req, res);
    }

    try {
        const { pageSize = 10, pageNo = 1, filterRules, sortrules, search, tags } = req.params;

        let filterOr = {};
        if (search && search !== "_") {
            hasFilter = true;

            filterOr = {
                $or: [
                    { type: { $regex: search, $options: "i" } },
                    { code: { $regex: search, $options: "i" } },
                    { title: { $regex: search, $options: "i" } },
                    { tags: { $elemMatch: { $regex: search, $options: "i" } } },                
                ],
            };
        }

        const sortRules = sortrules ? JSON.parse(sortrules) : [];
        const sortObj = {};
        sortRules.forEach((rule) => {
            sortObj[rule.field] = rule.order === "asc" ? 1 : -1;
        });
        if (!sortObj.createdAt) {
            sortObj.createdAt = -1;
        }

        const filterRules2 = filterRules ? JSON.parse(filterRules) : [];
        const filterAnd = {};
        filterRules2.forEach((rule) => {
            hasFilter = true;
            if (filterAnd[rule.field]=="tags")
                filterAnd[rule.field] = { $elemMatch: { $regex: rule.value, $options: "i" }};
            else
                filterAnd[rule.field] = { $regex: rule.value, $options: "i" };
        });

        if (tags!=='[]' && tags.length>0) {
            hasFilter = true;
            const parseJsonSafely = (value, fallback = []) => {
                try { return JSON.parse(value); }
                catch { return fallback; }
            };

            const tagsArray = parseJsonSafely(tags);
            filterAnd['tags'] = { $all: tagsArray } ;
        }

        const filter = {
          $and: [
            ...(Object.keys(filterAnd).length ? [filterAnd] : []),
            ...(Object.keys(filterOr).length ? [filterOr] : []),
          ],
        };

        if (hasFilter) {
            const pipeline = [
                { $match: filter },
                { $project: 
                    { _id: 1, assetType: 1, code: 1, title: 1, lat: 1, lng: 1, segments: 1, tags: 1
                      , filePath: {
                        $cond: {
                            if: "$isUploaded",
                                then: {
                                    $concat: [
                                        process.env.FILE_STORAGE,
                                        "/",
                                        BUCKET_NAME,
                                        "/",
                                        "$filePath"
                                    ]
                                },
                            else: "$filePath"   // or null if you prefer
                            }
                        },
                    }
                },
                ...(Object.keys(sortObj).length ? [{ $sort: sortObj }] : [{ $sort: { createdDate: -1 } }]),
                { $skip: (pageNo - 1) * parseInt(pageSize) },
                { $limit: parseInt(pageSize) },
            ];

            const [data, totalRows] = await Promise.all([
                Asset.aggregate(pipeline),
                Asset.countDocuments(filter),
            ]);

           res.json({ result: data, totalRows, totalPages: Math.ceil(totalRows / pageSize), });
        }
        else {
            const pipeline = [
                    { $project: 
                        { _id: 1, assetType: 1, code: 1, title: 1, lat: 1, lng: 1, segments: 1,
                         tags: {
                            $reduce: {
                            input: "$tags",
                            initialValue: "",
                            in: {
                                $cond: [
                                    { $eq: ["$$value", ""] },
                                    "$$this",
                                    { $concat: ["$$value", ", ", "$$this"] }
                                ]
                            }
                            }
                        },
                        filePath:{
                            $cond: {
                                if: "$isUploaded",
                                then: {
                                $concat: [
                                    process.env.FILE_STORAGE,
                                    "/",
                                    BUCKET_NAME,
                                    "/",
                                    "$filePath"
                                ]
                                },
                                else: "$filePath"   // or null if you prefer
                            }
                        },
                        }
                    },
                    ...(Object.keys(sortObj).length ? [{ $sort: sortObj }] : [{ $sort: { createdDate: -1 } }]),
                    { $skip: (pageNo - 1) * parseInt(pageSize) },
                    { $limit: parseInt(pageSize) },
                ];

                const [data, totalRows] = await Promise.all([
                    Asset.aggregate(pipeline),
                    Asset.countDocuments(),
                ]);

            res.json({ result: data, totalRows, totalPages: Math.ceil(totalRows / pageSize), });
        }

    } catch (error) {
        console.error("Error in :", error);
        res.status(500).json({ error: error.message });
    }
};

export const getAssetsByPagination2 = async (req, res) => {

    try {
        const { pageSize = -1, pageNo = -1, filterRules, sortrules, search } = req.params;

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
        sortRules.push({ field: "createdAt", order: -1 });

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
            { $project: { _id: 1, assetType: 1, code: 1, title: 1, filePath: 1, lat: 1, lng: 1, segments: 1}},
            ...(Object.keys(sortObj).length ? [{ $sort: sortObj }] : [{ $sort: { createdDate: -1 } }]),
          ];

        const [data, totalRows] = await Promise.all([
            Asset.aggregate(pipeline),
            Asset.countDocuments(filter),
        ]);

        return res.json({ result: data, totalRows, totalPages: 0, });
    } catch (error) {
        console.error("Error in :", error);
        res.status(500).json({ error: error.message });
  }
};
