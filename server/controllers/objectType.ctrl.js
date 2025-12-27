
import mongoose from "mongoose";
import ObjectType from "../models/objectType.model.js";

export const objectTypeBulkInsert = async (request, response)=>{
    try {
        const createdDocuments = await ObjectType.insertMany(request.body);
        response.status(201).json(createdDocuments);
    }
    catch(err){
        response.status(201).json(err);
    }
}