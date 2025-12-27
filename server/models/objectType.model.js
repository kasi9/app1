
import mongoose from 'mongoose';

const objectTypeSchema = new mongoose.Schema({
    tenantId: {type: mongoose.Schema.Types.ObjectId, required: [true,'Client should be selected.']},
    featureCode: {type: String}, // org: organization; user; 
    code: {type:String},
    typeName: {type: String, required:[true,'Type Name should not be blank']},

    isActive: {type: Boolean, required: true, default: true},
    isEditable: {type: Boolean, required: true, default: true},
    createdDate: {type: Date, required: true, default: new Date()},
    dateTimeStamp: {type: Date, required:true, default: new Date()},
    createdByUserId: mongoose.Schema.Types.ObjectId,
    modifiedByUserId: mongoose.Schema.Types.ObjectId,
    
    organizationTypeIdExt:{type: String}
});

const ObjectType = mongoose.model('objectType', objectTypeSchema);

export default ObjectType ;