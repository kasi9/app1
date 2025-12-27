
import mongoose from "mongoose";

const AudioSchema = new mongoose.Schema({
    tenantId: {type: mongoose.Schema.Types.ObjectId},
    organizationId: {type: mongoose.Schema.Types.ObjectId},
    code:{ type: String },
    audioName: { type: String },
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



const Audio = mongoose.model("Audio", AudioSchema);

export default Audio;
