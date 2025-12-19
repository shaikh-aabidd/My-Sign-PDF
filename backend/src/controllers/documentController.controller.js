// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { Document } from "../models/document.model.js";
// import { uploadOnCloudinary } from "../utils/cloudinary.js";
// import fs from "fs";

// const uploadDoc = asyncHandler(async (req, res) => {
//   if (!req.file) {
//     throw new ApiError(400, "No file uploaded");
//   }

//   const { originalname, path: localPath } = req.file;

//   // 1️⃣ Upload the PDF to Cloudinary as a raw file
//   const cloudResp = await uploadOnCloudinary(localPath);
//   if (!cloudResp) {
//     throw new ApiError(500, "Failed to upload document to cloud");
//   }

//   // 2️⃣ Save Cloudinary info instead of local path
//   const doc = await Document.create({
//     owner: req.user._id,
//     filename: originalname,
//     url: cloudResp.secure_url || cloudResp.url,
//     publicId: cloudResp.public_id,
//   });

//   // 3️⃣ Respond with the new document
//   return res
//     .status(201)
//     .json(new ApiResponse(201, doc, "Document uploaded successfully"));
// });

// // List all documents for the logged-in user
// const listDocs = asyncHandler(async (req, res) => {
//   const docs = await Document.find({ owner: req.user._id }).select('-__v');
//   return res
//     .status(200)
//     .json(new ApiResponse(200, docs, "Documents fetched successfully"));
// });

// // Get document metadata by ID
// const getDoc = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   if (!id) {
//     throw new ApiError(400, "Document ID is required");
//   }

//   const doc = await Document.findById(id).select('-__v');
//   if (!doc) {
//     throw new ApiError(404, "Document not found");
//   }
  
//   // Optionally stream the file
//   const filePath = path.resolve(doc.path);
//   if (!fs.existsSync(filePath)) {
//     throw new ApiError(404, "File not found on server");
//   }

//   res.set({
//     'Content-Type': 'application/pdf',
//     'Content-Disposition': `inline; filename="${doc.filename}"`,
//   });
//   const stream = fs.createReadStream(filePath);
//   stream.pipe(res);
// });

// // Delete a document (and its file)
// const deleteDoc = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   if (!id) {
//     throw new ApiError(400, "Document ID is required");
//   }

//   const doc = await Document.findById(id);
//   if (!doc) {
//     throw new ApiError(404, "Document not found");
//   }
  
//   // Only owner can delete
//   if (!doc.owner.equals(req.user._id)) {
//     throw new ApiError(403, "Not authorized to delete this document");
//   }

//   // Remove file from storage
//   const filePath = path.resolve(doc.path);
//   if (fs.existsSync(filePath)) {
//     fs.unlinkSync(filePath);
//   }

//   // Remove record
//   await Document.findByIdAndDelete(id);

//   return res
//     .status(200)
//     .json(new ApiResponse(200, {}, "Document deleted successfully"));
// });

// export {
//   uploadDoc,
//   listDocs,
//   getDoc,
//   deleteDoc,
// };

// v2
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { Document } from "../models/document.model.js";
// import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
// import fs from "fs";
// import path from "path";

// const uploadDoc = asyncHandler(async (req, res) => {
//   if (!req.file) {
//     throw new ApiError(400, "No file uploaded");
//   }

//   const { originalname, path: localPath } = req.file;

//   // Validate file type
//   if (!originalname.toLowerCase().endsWith('.pdf')) {
//     // Clean up local file
//     if (fs.existsSync(localPath)) {
//       fs.unlinkSync(localPath);
//     }
//     throw new ApiError(400, "Only PDF files are allowed");
//   }

//   try {
//     // Upload the PDF to Cloudinary - no need to pass options again
//     const cloudResp = await uploadOnCloudinary(localPath);

//     if (!cloudResp) {
//       throw new ApiError(500, "Failed to upload document to cloud");
//     }
//     // Save document metadata to database
//     const doc = await Document.create({
//       owner: req.user._id,
//       filename: originalname,
//       url: cloudResp.secure_url || cloudResp.url,
//       publicId: cloudResp.public_id,
//       fileSize: cloudResp.bytes,
//       mimeType: 'application/pdf',
//     });

//     // Clean up local file after successful upload
//     if (fs.existsSync(localPath)) {
//       fs.unlinkSync(localPath);
//     }

//     return res
//       .status(201)
//       .json(new ApiResponse(201, doc, "Document uploaded successfully"));
//   } catch (error) {
//     // Clean up local file on error
//     if (fs.existsSync(localPath)) {
//       fs.unlinkSync(localPath);
//     }
//     throw error;
//   }
// });

// // List all documents for the logged-in user
// const listDocs = asyncHandler(async (req, res) => {
//   const docs = await Document.find({ owner: req.user._id })
//     .select('-__v')
//     .sort({ uploadedAt: -1 }); // Most recent first

//   return res
//     .status(200)
//     .json(new ApiResponse(200, docs, "Documents fetched successfully"));
// });

// // Get document metadata by ID
// const getDoc = asyncHandler(async (req, res) => {
//   const { id } = req.params;
  
//   if (!id) {
//     throw new ApiError(400, "Document ID is required");
//   }

//   const doc = await Document.findById(id).select('-__v');
//   if (!doc) {
//     throw new ApiError(404, "Document not found");
//   }

//   // Check if user owns the document
//   if (!doc.owner.equals(req.user._id)) {
//     throw new ApiError(403, "Not authorized to access this document");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, doc, "Document fetched successfully"));
// });

// // Stream the actual PDF file
// const getDocFile = asyncHandler(async (req, res) => {
//   const { id } = req.params;
  
//   if (!id) {
//     throw new ApiError(400, "Document ID is required");
//   }

//   const doc = await Document.findById(id);
//   if (!doc) {
//     throw new ApiError(404, "Document not found");
//   }

//   // Check if user owns the document
//   if (!doc.owner.equals(req.user._id)) {
//     throw new ApiError(403, "Not authorized to access this document");
//   }

//   try {
//     // Fetch the PDF from Cloudinary
//     const response = await fetch(doc.url);
//     console.log("response: ",response.status)
    
//     if (!response.ok) {
//       throw new ApiError(500, "Failed to fetch document from storage");
//     }

//     // Set appropriate headers for PDF streaming
//     res.set({
//       'Content-Type': 'application/pdf',
//       'Content-Disposition': `inline; filename="${doc.filename}"`,
//       'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
//     });

//     // Stream the PDF content
//     const buffer = await response.arrayBuffer();
//     res.send(Buffer.from(buffer));
    
//   } catch (error) {
//     console.error('Error fetching document:', error);
//     throw new ApiError(500, "Failed to retrieve document");
//   }
// });


// // Delete a document (and its file from Cloudinary)
// const deleteDoc = asyncHandler(async (req, res) => {
//   const { id } = req.params;
  
//   if (!id) {
//     throw new ApiError(400, "Document ID is required");
//   }

//   const doc = await Document.findById(id);
//   if (!doc) {
//     throw new ApiError(404, "Document not found");
//   }
  
//   // Only owner can delete
//   if (!doc.owner.equals(req.user._id)) {
//     throw new ApiError(403, "Not authorized to delete this document");
//   }

//   try {
//     // Delete file from Cloudinary - using publicId is more reliable
//     if (doc.publicId) {
//       await deleteFromCloudinary(doc.publicId);
//     }

//     // Remove document record from database
//     await Document.findByIdAndDelete(id);

//     return res
//       .status(200)
//       .json(new ApiResponse(200, {}, "Document deleted successfully"));
//   } catch (error) {
//     console.error('Error deleting document:', error);
//     throw new ApiError(500, "Failed to delete document");
//   }
// });

// export {
//   uploadDoc,
//   listDocs,
//   getDoc,
//   getDocFile,
//   deleteDoc,
// };




import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Document } from "../models/document.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import path from "path";

const uploadDoc = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const { originalname, path: localPath } = req.file;

  // Validate file type
  if (!originalname.toLowerCase().endsWith('.pdf')) {
    // Clean up local file
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    throw new ApiError(400, "Only PDF files are allowed");
  }

  try {
    // Upload the PDF to Cloudinary
    const cloudResp = await uploadOnCloudinary(localPath);

    if (!cloudResp) {
      throw new ApiError(500, "Failed to upload document to cloud");
    }
    
    // Save document metadata to database
    const doc = await Document.create({
      owner: req.user._id,
      filename: originalname,
      url: cloudResp.secure_url || cloudResp.url,
      publicId: cloudResp.public_id,
      fileSize: cloudResp.bytes,
      mimeType: 'application/pdf',
    });

    // Clean up local file after successful upload
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }

    return res
      .status(201)
      .json(new ApiResponse(201, doc, "Document uploaded successfully"));
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    throw error;
  }
});

// List all documents for the logged-in user
const listDocs = asyncHandler(async (req, res) => {
  const docs = await Document.find({ owner: req.user._id })
    .select('-__v')
    .sort({ uploadedAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, docs, "Documents fetched successfully"));
});

// Get document metadata by ID
const getDoc = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ApiError(400, "Document ID is required");
  }

  const doc = await Document.findById(id).select('-__v');
  if (!doc) {
    throw new ApiError(404, "Document not found");
  }

  // Check if user owns the document
  if (!doc.owner.equals(req.user._id)) {
    throw new ApiError(403, "Not authorized to access this document");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, doc, "Document fetched successfully"));
});

// IMPROVED: Stream the actual PDF file from Cloudinary
const getDocFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ApiError(400, "Document ID is required");
  }

  const doc = await Document.findById(id);
  if (!doc) {
    throw new ApiError(404, "Document not found");
  }

  // Check if user owns the document
  if (!doc.owner.equals(req.user._id)) {
    throw new ApiError(403, "Not authorized to access this document");
  }

  try {
    // Method 1: Direct streaming from Cloudinary URL
    const response = await fetch(doc.url);
    
    if (!response.ok) {
      console.error(`Failed to fetch from Cloudinary: ${response.status} ${response.statusText}`);
      throw new ApiError(500, "Failed to fetch document from storage");
    }

    // Set appropriate headers for PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.filename)}"`,
      'Content-Length': response.headers.get('content-length'),
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Accept-Ranges': 'bytes',
    });

    // Stream the response body directly to the client
    const reader = response.body.getReader();
    
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          if (!res.write(value)) {
            // If write buffer is full, wait for drain event
            await new Promise(resolve => res.once('drain', resolve));
          }
        }
        res.end();
      } catch (error) {
        console.error('Error streaming PDF:', error);
        reader.releaseLock();
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream document' });
        }
      }
    };

    await pump();
    
  } catch (error) {
    console.error('Error in getDocFile:', error);
    if (!res.headersSent) {
      throw new ApiError(500, "Failed to retrieve document");
    }
  }
});

// ALTERNATIVE: Simple redirect method (easier but less control)
const getDocFileRedirect = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ApiError(400, "Document ID is required");
  }

  const doc = await Document.findById(id);
  if (!doc) {
    throw new ApiError(404, "Document not found");
  }

  // Check if user owns the document
  if (!doc.owner.equals(req.user._id)) {
    throw new ApiError(403, "Not authorized to access this document");
  }

  // Simple redirect to Cloudinary URL
  return res.redirect(doc.url);
});

// ALTERNATIVE: Return signed URL for direct access
const getDocUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ApiError(400, "Document ID is required");
  }

  const doc = await Document.findById(id);
  if (!doc) {
    throw new ApiError(404, "Document not found");
  }

  // Check if user owns the document
  if (!doc.owner.equals(req.user._id)) {
    throw new ApiError(403, "Not authorized to access this document");
  }

  // Return the Cloudinary URL directly
  return res
    .status(200)
    .json(new ApiResponse(200, { 
      url: doc.url,
      filename: doc.filename,
      fileSize: doc.fileSize 
    }, "Document URL fetched successfully"));
});

// Delete a document (and its file from Cloudinary)
const deleteDoc = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ApiError(400, "Document ID is required");
  }

  const doc = await Document.findById(id);
  if (!doc) {
    throw new ApiError(404, "Document not found");
  }
  
  // Only owner can delete
  if (!doc.owner.equals(req.user._id)) {
    throw new ApiError(403, "Not authorized to delete this document");
  }

  try {
    // Delete file from Cloudinary
    if (doc.publicId) {
      await deleteFromCloudinary(doc.publicId);
    }

    // Remove document record from database
    await Document.findByIdAndDelete(id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Document deleted successfully"));
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new ApiError(500, "Failed to delete document");
  }
});

const updateSignedDoc = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    throw new ApiError(400, "Signed PDF file is required");
  }

  // 1) Find existing record
  const doc = await Document.findById(id);
  if (!doc) {
    throw new ApiError(404, "Document not found");
  }
  // ensure ownership
  if (!doc.owner.equals(req.user._id)) {
    throw new ApiError(403, "Not authorized to update this document");
  }

  // 2) Upload new signed PDF to Cloudinary
  const uploadResult = await uploadOnCloudinary(req.file.path);
  if (!uploadResult) {
    throw new ApiError(500, "Failed to upload signed PDF to cloud");
  }

  // 3) Delete old PDF from Cloudinary
  await deleteFromCloudinary(doc.publicId);

  // 4) Update the document record
  doc.url        = uploadResult.secure_url || uploadResult.url;
  doc.publicId   = uploadResult.public_id;
  doc.filename   = req.file.originalname;
  doc.fileSize   = req.file.size;
  doc.mimeType   = req.file.mimetype;
  doc.uploadedAt = Date.now();
    
  await doc.save();

  // 5) Return updated record
  return res
    .status(200)
    .json(new ApiResponse(200, doc, "Document updated with signed PDF"));
});

export {
  uploadDoc,
  listDocs,
  getDoc,
  getDocFile,
  getDocFileRedirect,
  getDocUrl,
  deleteDoc,
  updateSignedDoc,
};