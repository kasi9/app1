
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    logDate: {type: Date, default: Date.now},
    userId: mongoose.Schema.Types.ObjectId,
    messageType: String, // Error/warning etc.
    message: String,
});

export default mongoose.model("AuditLog", auditLogSchema);
