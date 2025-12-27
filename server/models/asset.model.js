
import mongoose from "mongoose";
import Counter from '../models/counter.model.js';

const SegmentSchema = new mongoose.Schema({
    start: { type: Number},
    end: { type: Number},
});

const AssetSchema = new mongoose.Schema({
    tenantId: {type: mongoose.Schema.Types.ObjectId, required : true},
    organizationId: {type: mongoose.Schema.Types.ObjectId, required: true},
    assetType: {type: String, required: true},
    isUploaded: {type: Boolean, default: false},
    code:{ type: String, required: true },
    name: { type: String },
    title: {type: String},
    description: {type: String},
    filePath: {type: String},
    lat: {type: Number},
    lng: {type:Number},
    segments: [SegmentSchema],
    tags: {type: [String], default:[]},

    isActive: {type: Boolean, default: true},
    isEditable: {type: Boolean, default: true},
    createdByUserId: {type: mongoose.Schema.Types.ObjectId, required: true},
    modifiedByUserId: mongoose.Schema.Types.ObjectId,
    
    organizationIdExt: {type: String},
}, { timestamps: true });
/*
AssetSchema.pre("save", async function (next) {
  if (this.code) return next();

  const counter = await Counter.findOneAndUpdate(
    { name: "assetCode" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  this.code = counter.seq;
  next();
});
*/
const Asset = mongoose.model("Asset", AssetSchema);

export default Asset;
