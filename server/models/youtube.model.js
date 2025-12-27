import mongoose from "mongoose";

const segmentSchema = new mongoose.Schema({
    start: {type: Number},
    end: {type: Number},
});

const youTubeVideo = new mongoose.Schema({
    tenantId: {type: mongoose.Schema.Types.ObjectId},
    organizationId: {type: mongoose.Schema.Types.ObjectId},
    videoId: String,
    title: {type: String},
    description: {type: String},
    segments: [segmentSchema],

    isActive: {type: Boolean, required: true, default: true},
    isEditable: {type: Boolean, required: true, default: true},
    createdDate: {type: Date, required: true, default: new Date()},
    dateTimeStamp: {type: Date, required:true, default: new Date()},

    videoIdExt: {type: String}
});

const YouTubeVideo = mongoose.model('YouTubeVideo', youTubeVideo);

export default YouTubeVideo;