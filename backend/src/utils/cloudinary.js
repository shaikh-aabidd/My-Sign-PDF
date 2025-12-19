// import { v2 as cloudinary } from 'cloudinary';
// import fs from "fs"

// // Configuration
// cloudinary.config({ 
//     cloud_name: process.env.CLOUDINARY_NAME, 
//     api_key: process.env.CLOUDINARY_API_KEY, 
//     api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
// });

// const uploadOnCloudinary = async(localFilePath)=>{
//     try {
//         if(!localFilePath) return null;
//         //upload the file on cloudinary
//         const resoponse = await cloudinary.uploader.upload(localFilePath,{
//             resource_type:"auto"
//         })
//         //response returns an array

//         //file uploaded successfully
//         fs.unlinkSync(localFilePath);
//         console.log("File is uplaoded on cloudinary successfully ",resoponse.url)
//         return resoponse;
//     } catch (error) {
//         fs.unlinkSync(localFilePath); //remove locally stored file on the server
//         console.log("Error while uploading file on cloudinary")
//         return null;
//     }
// }

// const deleteFromCloudinary = async (fileUrl) => {
//     if (!fileUrl) return null;
  
//     try {
//       const url = new URL(fileUrl);
//       const path = url.pathname.split('/').slice(2).join('/');  
//       const publicId = path.replace(/\.[^/.]+$/, '');        
  
//       // **Await** the destroy call
//       const result = await cloudinary.uploader.destroy(publicId);
//       console.log('Cloudinary Delete Response:', result);
//       return result;
//     } catch (error) {
//       console.error('Error deleting file from Cloudinary:', error);
//       return null;
//     }
//   };

// export {
//     uploadOnCloudinary,
//     deleteFromCloudinary
// };



import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.warn("uploadOnCloudinary called without a file path");
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw",
      folder: "documents",
    });
    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  } finally {
    fs.unlink(localFilePath, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
    });
  }
};

export const deleteFromCloudinary = async (identifier) => {
  if (!identifier) return null;
  
  try {
    let publicId;
    
    // Check if it's a URL or already a publicId
    if (identifier.startsWith('http')) {
      // It's a URL - extract publicId
      const url = new URL(identifier);
      const path = url.pathname.split('/').slice(2).join('/');
      publicId = path.replace(/\.[^/.]+$/, '');
    } else {
      // It's already a publicId
      publicId = identifier;
    }
    
    const result = await cloudinary.uploader.destroy(publicId, { 
      resource_type: "raw" 
    });
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return null;
  }
};
