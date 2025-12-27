
import mongoose from "mongoose";

const personSchema = new mongoose.Schema({
    tenantId: {type: mongoose.Schema.Types.ObjectId},
    organizationId: {type: mongoose.Schema.Types.ObjectId},
    code: {type:String},
    personName: {type: String},
    mobileNo: {type: String},
    address: {type: String},
    user: { type: mongoose.Schema.Types.ObjectId, ref:'User', required: false},
    
    isActive: {type: Boolean, required: true, default: true},
    isEditable: {type: Boolean, required: true, default: true},
    createdDate: {type: Date, required: true, default: new Date()},
    dateTimeStamp: {type: Date, required:true, default: new Date()},
    createdByUserId: mongoose.Schema.Types.ObjectId,
    modifiedByUserId: mongoose.Schema.Types.ObjectId,
    
    organizationIdExt: {type: String}
});

const Person = mongoose.model("Person", personSchema);

export default Person;