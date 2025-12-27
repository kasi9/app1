// models/auditLog.model.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  collectionName: String,
  documentId: mongoose.Schema.Types.ObjectId,
  action: { type: String, enum: ["CREATE", "UPDATE", "DELETE"], required: true },
  changes: Object, // now stores { field: { old, new } }
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("AuditLog", auditLogSchema);
