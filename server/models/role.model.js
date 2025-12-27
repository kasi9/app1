
import mongoose from "mongoose";

const privilegeSchema = new mongoose.Schema({
    code: {type: String},
    name: {type: String},
    actions:[{type: String}]
});

const roleSchema = new mongoose.Schema({
    tenantId: {type: mongoose.Schema.Types.ObjectId},
    organizationId: {type: mongoose.Schema.Types.ObjectId},
    code: {type: String},
    rolename: {type: String},
    icon: { data: Buffer, contentType: String},
    description: {type: String},
    privileges: [privilegeSchema],

    isActive: {type: Boolean, required: true, default: true},
    isEditable: {type: Boolean, required: true, default: true},
    createdDate: {type: Date, required: true, default: new Date()},
    dateTimeStamp: {type: Date, required:true, default: new Date()},

    roleIdExt: {type: String}
});

const Role = mongoose.model('Role', roleSchema);

export default Role;
