import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  tenantId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.ObjectId,
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
  createdAt: { type: Date, default: Date.now }
});

const Log = mongoose.model("Log", logSchema);
export default Log;
