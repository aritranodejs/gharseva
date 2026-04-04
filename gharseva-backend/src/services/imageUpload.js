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
const uploadFileBuffer = async (multerFile, folder = 'uploads/others') => {
  if (IMAGEKIT_ENABLED && imagekit) {
    try {
      // Clean folder name (remove leading slash)
      const cleanFolder = folder.startsWith('/') ? folder.slice(1) : folder;
      
      console.log(`[ImageUpload] Attempting Cloud upload for: ${multerFile.originalname} to ${cleanFolder}`);
      
      // --- Upload ONLY to ImageKit ---
      const response = await imagekit.upload({
        file: multerFile.buffer, // Pass buffer directly (faster/more reliable)
        fileName: `${Date.now()}_${multerFile.originalname}`,
        folder: cleanFolder,
        useUniqueFileName: true,
      });

      console.log(`[ImageUpload] ✅ Cloud SUCCESS: ${response.url}`);
      return response.filePath;
    } catch (err) {
      console.error('[ImageUpload] ❌ Cloud Error:', err.message);
      // Fallback: If cloud fails, save locally so we don't lose the data
      console.log('[ImageUpload] ⚠️ Falling back to Local Storage...');
      return await saveLocally(multerFile, folder); 
    }
  } else {
    return await saveLocally(multerFile, folder);
  }
};

const saveLocally = async (multerFile, folder) => {
  const uploadsBaseDir = path.join(__dirname, '../../');
  const targetDir = path.join(uploadsBaseDir, folder.startsWith('/') ? folder : `/${folder}`);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const localFileName = `${Date.now()}_${multerFile.originalname}`;
  const filePath = path.join(targetDir, localFileName);
  fs.writeFileSync(filePath, multerFile.buffer);

  const relativePath = folder.startsWith('/') ? `${folder}/${localFileName}` : `/${folder}/${localFileName}`;
  console.log(`[ImageUpload] 💾 Local SAVE: ${relativePath}`);
  return relativePath;
};

module.exports = { uploadFileBuffer, IMAGEKIT_ENABLED };
