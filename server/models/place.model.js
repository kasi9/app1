
import mongoose from "mongoose";
import { auditMiddleware } from "../utils/auditMiddleware.js";

const PlaceSchema = new mongoose.Schema({
    tenantId: {type: mongoose.Schema.Types.ObjectId},
    organizationId: {type: mongoose.Schema.Types.ObjectId},
    code:{ type: String },
    placeName: { type: String },
    address: {type: String},
    latitude: {type: Number},
    longitude: {type: Number},

    isActive: {type: Boolean, required: true, default: true},
    isEditable: {type: Boolean, required: true, default: true},
    createdDate: {type: Date, required: true, default: new Date()},
    dateTimeStamp: {type: Date, required:true, default: new Date()},
    createdByUserId: mongoose.Schema.Types.ObjectId,
    modifiedByUserId: mongoose.Schema.Types.ObjectId,
    
    organizationIdExt: {type: String},
});

auditMiddleware(PlaceSchema, "places");

const Place = mongoose.model("Place", PlaceSchema);

export default Place;
