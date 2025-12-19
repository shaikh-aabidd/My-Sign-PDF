import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Audit } from "../models/audit.model.js";

// Get audit trail for a document
const getAuditTrail = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  if (!documentId) {
    throw new ApiError(400, "Document ID is required");
  }

  const audits = await Audit.find({ documentId })
    .sort({ timestamp: -1 })
    .populate("userId", "name email");

  if (!audits || audits.length === 0) {
    throw new ApiError(404, "No audit logs found for this document");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, audits, "Audit logs fetched successfully"));
});

export { getAuditTrail };
