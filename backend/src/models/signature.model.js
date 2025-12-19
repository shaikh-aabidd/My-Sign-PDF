import mongoose, { Schema } from "mongoose";

const sigSchema = new Schema({
  documentId: { type: mongoose.Types.ObjectId, ref: 'Document', required: true },
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  page: { type: Number, required: true },
  status: { type: String, enum: ['pending','signed','rejected'], default: 'pending' },
  reason: { type: String, default: '' },
  // New fields for embedded signature image
  imageUrl: { type: String, required: true },        // Cloudinary URL of signature PNG
  publicId: { type: String, required: true },        // Cloudinary public ID for deletion
  createdAt: { type: Date, default: Date.now }       // Timestamp of when signature was saved
});

export const Signature = mongoose.model('Signature', sigSchema);