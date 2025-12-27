
import mongoose from "mongoose";
import { auditMiddleware } from "../utils/auditMiddleware.js";

const ImageSchema = new mongoose.Schema({
    tenantId: {type: mongoose.Schema.Types.ObjectId},
    organizationId: {type: mongoose.Schema.Types.ObjectId},
    code:{ type: String },
    imageName: { type: String },
    title: {type: String},
    filePath: {type: String},

    isActive: {type: Boolean, required: true, default: true},
    isEditable: {type: Boolean, required: true, default: true},
    createdDate: {type: Date, required: true, default: new Date()},
    dateTimeStamp: {type: Date, required:true, default: new Date()},
    createdByUserId: mongoose.Schema.Types.ObjectId,
    modifiedByUserId: mongoose.Schema.Types.ObjectId,
    
    organizationIdExt: {type: String},
});

auditMiddleware(ImageSchema, "images");

const Image = mongoose.model("Image", ImageSchema);

export default Image;
