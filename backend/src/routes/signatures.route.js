import { Router } from "express";
import {
  saveSignature,
  getSignatures,
  finalizeSignatures,
} from "../controllers/signatureController.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"


const sigRouter = Router();

// Save or update signature position
sigRouter.post(
  "/",
  verifyJWT,
  upload.single('signatureImage'),
  saveSignature
);

//Get all signatures for a document 
sigRouter.get(
  "/:documentId",
  verifyJWT,
  getSignatures
);

// Finalize (approve) all pending signatures
sigRouter.post(
  "/finalize",
  verifyJWT,
  finalizeSignatures
);

export default sigRouter;