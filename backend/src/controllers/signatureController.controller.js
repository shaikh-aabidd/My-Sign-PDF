import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Signature } from "../models/signature.model.js";
import { Document } from "../models/document.model.js";
import { Audit } from "../models/audit.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Save a signature position and status
// Save a signature position with embedded image
const saveSignature = asyncHandler(async (req, res) => {
  const { documentId, x, y, page, status = "pending", reason = "" } = req.body;
  const file = req.file;

  // Validate fields + file
  if (!documentId || x == null || y == null || page == null || !file) {
    throw new ApiError(400, "documentId, x, y, page, and signatureImage file are required");
  }

  // Ensure document exists
  const doc = await Document.findById(documentId);
  if (!doc) throw new ApiError(404, "Document not found");

  // Upload the file Multer saved to disk directly to Cloudinary
  const uploadResponse = await uploadOnCloudinary(file.path);
  if (!uploadResponse) throw new ApiError(500, "Failed to upload signature image");

  // Create signature record
  const signature = await Signature.create({
    documentId,
    userId: req.user._id,
    x: Number(x),
    y: Number(y),
    page: Number(page),
    status,
    reason,
    imageUrl: uploadResponse.secure_url || uploadResponse.url,
    publicId: uploadResponse.public_id
  });

  // Audit
  await Audit.create({
    documentId,
    userId: req.user._id,
    action: `signature-${status}`,
    ip: req.ip,
  });

  res
    .status(201)
    .json(new ApiResponse(201, signature, "Signature saved successfully"));
});

// Get all signatures for a document
const getSignatures = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  if (!documentId) {
    throw new ApiError(400, "Document ID is required");
  }

  const signatures = await Signature.find({ documentId }).populate("userId", "name email");
  return res
    .status(200)
    .json(new ApiResponse(200, signatures, "Signatures fetched successfully"));
});

// Finalize document (approve and lock signatures)
const finalizeSignatures = asyncHandler(async (req, res) => {
  const { documentId } = req.body;
  if (!documentId) {
    throw new ApiError(400, "Document ID is required");
  }

  const doc = await Document.findById(documentId);
  console.log(doc)
  if (!doc) {
    throw new ApiError(404, "Document not found");
  }

  const updated = await Signature.updateMany(
    { documentId, status: "pending" },
    { $set: { status: "signed" } }
  );

  await Audit.create({
    documentId,
    userId: req.user._id,
    action: "finalize",
    ip: req.ip,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Document finalized successfully"));
});

export {
  saveSignature,
  getSignatures,
  finalizeSignatures,
};
