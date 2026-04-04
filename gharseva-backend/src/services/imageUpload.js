const ImageKit = require('imagekit');
const fs = require('fs');
const path = require('path');

// Feature flag: read from environment
const IMAGEKIT_ENABLED = process.env.IMAGEKIT_ENABLED === 'true';

let imagekit = null;

if (IMAGEKIT_ENABLED) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
  console.log('[ImageUpload] ImageKit is ENABLED — images will be uploaded to ImageKit CDN');
} else {
  console.log('[ImageUpload] ImageKit is DISABLED — images will be stored on the backend server');
}

/**
 * Upload a multer file buffer to ImageKit or save locally.
 * Returns only the relative path (e.g., /uploads/profilePicture/123.jpg).
 *
 * @param {Object} multerFile  - Multer file object with .buffer, .originalname
 * @param {string} folder      - Destination folder path (must start with /uploads)
 * @returns {Promise<string>}  - The saved image path (to be stored in DB)
 */
const uploadFileBuffer = async (multerFile, folder = '/uploads/others') => {
  if (IMAGEKIT_ENABLED && imagekit) {
    // --- Upload to ImageKit ---
    const response = await imagekit.upload({
      file: multerFile.buffer.toString('base64'),
      fileName: `${Date.now()}_${multerFile.originalname}`,
      folder: folder,
      useUniqueFileName: true,
    });
    // Return only the filePath (e.g. /uploads/profilePicture/123.jpg)
    return response.filePath;
  } else {
    // --- Save locally to /uploads ---
    const uploadsBaseDir = path.join(__dirname, '../../'); // Project root
    const targetDir = path.join(uploadsBaseDir, folder);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const localFileName = `${Date.now()}_${multerFile.originalname}`;
    const filePath = path.join(targetDir, localFileName);
    fs.writeFileSync(filePath, multerFile.buffer);

    // Return the relative path (consistent with ImageKit filePath)
    return `${folder}/${localFileName}`;
  }
};

module.exports = { uploadFileBuffer, IMAGEKIT_ENABLED };
