// utils/auditMiddleware.js
import mongoose from "mongoose";
import AuditLog from "../models/auditLog.model.js";
import _ from "lodash";

export const auditMiddleware = (schema, collectionName) => {
  const IGNORED_FIELDS = ["__v", "updatedAt", "createdAt"];

  // 🟡 PRE — Capture old data
  schema.pre(["findOneAndUpdate", "save"], async function (next) {
    try {
      if (this instanceof mongoose.Query) {
        // Query middleware (for findOneAndUpdate)
        const oldDoc = await this.model.findOne(this.getQuery()).lean();
        this.set("_oldDoc", oldDoc); // store in the query
      } else if (!this.isNew) {
        // Document middleware (for save)
        const oldDoc = await this.constructor.findById(this._id).lean();
        this._oldDoc = oldDoc;
      }
    } catch (err) {
      console.error("Audit pre-hook error:", err);
    }
    next();
  });

  // 🟢 POST — Compare and log changes
  schema.post(["findOneAndUpdate", "save"], async function (res) {
    try {
      const isQuery = this instanceof mongoose.Query;
      const oldDoc = isQuery ? this.get("_oldDoc") : this._oldDoc;

      // skip CREATE (no old doc)
      if (!oldDoc) {
        const doc = res || this;
        await AuditLog.create({
          collectionName,
          documentId: doc._id,
          action: "CREATE",
          changes: doc.toObject ? doc.toObject() : doc,
          createdBy: doc._modifiedBy || "system",
        });
        return;
      }

      const newDoc = (res && res.toObject ? res.toObject() : this.toObject?.()) || {};
      const changes = {};

      // compute diff excluding ignored fields
      for (const key of Object.keys(newDoc)) {
        if (IGNORED_FIELDS.includes(key)) continue;
        if (!_.isEqual(newDoc[key], oldDoc[key])) {
          changes[key] = { old: oldDoc[key], new: newDoc[key] };
        }
      }

      if (Object.keys(changes).length === 0) return;

      await AuditLog.create({
        collectionName,
        documentId: newDoc._id || this._id,
        action: "UPDATE",
        changes,
        createdBy: newDoc._modifiedBy || "system",
      });
    } catch (err) {
      console.error("Audit post-hook error:", err);
    }
  });

  // 🗑 DELETE — Simple delete log
  schema.post("findOneAndDelete", async function (res) {
    if (!res) return;
    await AuditLog.create({
      collectionName,
      documentId: res._id,
      action: "DELETE",
      createdBy: res._modifiedBy || "system",
    });
  });
};
