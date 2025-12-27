
import mongoose from "mongoose";
import { auditMiddleware } from "../utils/auditMiddleware.js";

const OrganizationSchema = new mongoose.Schema({
    tenantId: {type: mongoose.Schema.Types.ObjectId},
    organizationId: {type: mongoose.Schema.Types.ObjectId},
    parentId: {type: mongoose.Schema.Types.ObjectId},
    organizationTypeId: {type: mongoose.Schema.Types.ObjectId}, 
    logo: { data: Buffer, contentType: String},
    code:{ type: String },
    organizationName: { type: String },
    address: {type: String},

    isActive: {type: Boolean, required: true, default: true},
    isEditable: {type: Boolean, required: true, default: true},
    createdDate: {type: Date, required: true, default: new Date()},
    dateTimeStamp: {type: Date, required:true, default: new Date()},
    createdByUserId: mongoose.Schema.Types.ObjectId,
    modifiedByUserId: mongoose.Schema.Types.ObjectId,
    
    organizationIdExt: {type: String},
    parentIdExt: {type: String},
    organizationTypeIdExt:{type: String}
});

auditMiddleware(OrganizationSchema, "organizations");

const Organization = mongoose.model("Organization", OrganizationSchema);

export default Organization;
