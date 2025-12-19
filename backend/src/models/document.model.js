// import mongoose ,{Schema} from "mongoose";

// const docSchema = new Schema({
//   owner: { type: mongoose.Types.ObjectId, ref: 'User' },
//   filename: String,
//   url: String,
//   publicId:String,
//   uploadedAt: { type: Date, default: Date.now }
// });
// export const Document = mongoose.model('Document', docSchema);

import mongoose, { Schema } from "mongoose";

const documentSchema = new Schema({
  owner: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  filename: { 
    type: String, 
    required: true 
  },
  url: { 
    type: String, 
    required: true 
  },
  publicId: { 
    type: String, 
    required: true 
  },
  fileSize: { 
    type: Number, 
    default: 0 
  },
  mimeType: { 
    type: String, 
    default: 'application/pdf' 
  },
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
documentSchema.index({ owner: 1, uploadedAt: -1 });

// Virtual to check if document has signatures
documentSchema.virtual('hasSignatures', {
  ref: 'Signature',
  localField: '_id',
  foreignField: 'documentId',
  count: true
});

// Virtual to get all signatures for this document
documentSchema.virtual('signatures', {
  ref: 'Signature',
  localField: '_id',
  foreignField: 'documentId'
});

// Virtual for file size in human readable format
documentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Method to check if document is fully signed
documentSchema.methods.isFullySigned = async function() {
  const signatureCount = await mongoose.model('Signature').countDocuments({
    documentId: this._id,
    status: 'signed'
  });
  return signatureCount > 0;
};

// Method to get signature status
documentSchema.methods.getSignatureStatus = async function() {
  const signatures = await mongoose.model('Signature').find({
    documentId: this._id
  });
  
  return {
    total: signatures.length,
    signed: signatures.filter(s => s.status === 'signed').length,
    pending: signatures.filter(s => s.status === 'pending').length,
    rejected: signatures.filter(s => s.status === 'rejected').length
  };
};

// Ensure virtuals are included in JSON
documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

export const Document = mongoose.model('Document', documentSchema);