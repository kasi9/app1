import mongoose from "mongoose";

const LogSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    method: String,
    url: String,
    status: Number,
    ip: String,
    responseTime: Number,
    success: Boolean,
    responseType: String,
    errorCode: String,
    requestBody: mongoose.Schema.Types.Mixed,
    responseBody: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now, index: true }
});

LogSchema.index(
    { createdAt: 1 },
    {
        expireAfterSeconds: 60 * 60 * 24 * 7,
        partialFilterExpression: { success: true }
    }
);

LogSchema.index(
    { createdAt: 1 },
    {
        expireAfterSeconds: 60 * 60 * 24 * 14,
        partialFilterExpression: { success: false }
    }
);

const Log = mongoose.model("Log", LogSchema, 'logs');

export default Log;
