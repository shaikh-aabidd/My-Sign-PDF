// import { Router } from "express";
// import multer from "multer";
// import {
//   uploadDoc,
//   listDocs,
//   getDoc,
//   deleteDoc,
//   getDocFile,
// } from "../controllers/documentController.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import {upload} from "../middlewares/multer.middleware.js"


// const docsRouter = Router();

// // Upload a PDF document
// docsRouter.post(
//   "/",
//   verifyJWT,
//   upload.single('file'),
//   uploadDoc
// );

// // List all user documents
// docsRouter.get(
//   "/",
//   verifyJWT,
//   listDocs
// );

// // Stream a document by ID
// docsRouter.get(
//   "/:id/file",
//   verifyJWT,
//   getDocFile
// );

// // Get document metadata by ID
// docsRouter.get(
//   "/:id",
//   verifyJWT,
//   getDoc
// );

// // Delete a document by ID
// docsRouter.delete(
//   "/:id",
//   verifyJWT,
//   deleteDoc
// );


// export default docsRouter;

import { Router } from "express";
import {
  uploadDoc,
  listDocs,
  getDoc,
  deleteDoc,
  getDocFile,
  getDocFileRedirect,
  getDocUrl,
  updateSignedDoc,
} from "../controllers/documentController.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const docsRouter = Router();

// Upload a PDF document
docsRouter.post(
  "/",
  verifyJWT,
  upload.single('file'),
  uploadDoc
);

// List all user documents
docsRouter.get(
  "/",
  verifyJWT,
  listDocs
);

// Get document URL (for frontend to fetch directly)
docsRouter.get(
  "/:id/url",
  verifyJWT,
  getDocUrl
);

// Stream a document by ID (proxy through your server)
docsRouter.get(
  "/:id/file",
  verifyJWT,
  getDocFile
);

// Alternative: Simple redirect to Cloudinary
docsRouter.get(
  "/:id/redirect",
  verifyJWT,
  getDocFileRedirect
);

// Get document metadata by ID
docsRouter.get(
  "/:id",
  verifyJWT,
  getDoc
);

// Delete a document by ID
docsRouter.delete(
  "/:id",
  verifyJWT,
  deleteDoc
);

//update doc
docsRouter.patch(
  "/:id/signed",
  verifyJWT,
  upload.single("file"),
  updateSignedDoc
);

export default docsRouter;