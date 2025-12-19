import mongoose ,{Schema} from "mongoose";

const auditSchema = new Schema({
  documentId: { type: mongoose.Types.ObjectId, ref: 'Document' },
  userId: { type: mongoose.Types.ObjectId, ref: 'User' },
  action: String,      // e.g. "signed", "rejected"
  timestamp: { type: Date, default: Date.now },
  ip: String
});
export const Audit = mongoose.model('Audit', auditSchema);
