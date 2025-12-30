
import mongoose from "mongoose";

const TagSchema = new mongoose.Schema({
    tenantId: {type: mongoose.Schema.Types.ObjectId},
    title: { type: String },
});

const TagModel = mongoose.model("Tag", TagSchema);

export default TagModel;
