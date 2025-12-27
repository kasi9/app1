
import mongoose from 'mongoose';

const { Schema } = mongoose;

const privilegeSchema = new mongoose.Schema({
    code: {type: String},
    name: {type: String},
    actions:[{type: String}]
});

const userSchema = new mongoose.Schema({
    tenantId: {type: mongoose.Schema.Types.ObjectId},
    organizationId: {type: mongoose.Schema.Types.ObjectId},
    avatar: { data: Buffer, contentType: String},
    loginName: {type: String},
    password: {type: String},
    userType: {type: String}, // admin: tenant admin
    lastLoginDate: {type: Date},
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role'}],
    privileges: [privilegeSchema],
    
    isActive: {type: Boolean, required: true, default: true},
    isEditable: {type: Boolean, required: true, default: true},
    createdDate: {type: Date, required: true, default: new Date()},
    dateTimeStamp: {type: Date, required:true, default: new Date()},
    createdByUserId: mongoose.Schema.Types.ObjectId,
    modifiedByUserId: mongoose.Schema.Types.ObjectId,
    
    organizationIdExt: {type: String},
});

const User = mongoose.model('User',userSchema);

export default User;