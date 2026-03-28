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
 * Upload a base64 encoded image.
 * - If IMAGEKIT_ENABLED=true  → uploads to ImageKit CDN, returns public URL
 * - If IMAGEKIT_ENABLED=false → saves to /uploads/ folder, returns local URL
 *
 * @param {string} base64Data - Full base64 string (with or without data URI prefix)
 * @param {string} fileName   - Desired filename (without extension)
 * @returns {Promise<string>}  - Public image URL
 */
const uploadImage = async (base64Data, fileName) => {
  // Strip the data URI prefix if present (e.g., "data:image/jpeg;base64,...")
  const base64Clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const mimeMatch = base64Data.match(/data:([^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const ext = mimeType.split('/')[1] || 'jpg';

  if (IMAGEKIT_ENABLED && imagekit) {
    // --- Upload to ImageKit ---
    const response = await imagekit.upload({
      file: base64Clean,
      fileName: `${fileName}_${Date.now()}.${ext}`,
      folder: '/gharseva/profiles',
      useUniqueFileName: true,
    });
    return response.url;
  } else {
    // --- Save locally to /uploads ---
    const uploadsDir = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFileName = `${fileName}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, localFileName);
    fs.writeFileSync(filePath, Buffer.from(base64Clean, 'base64'));

    return `uploads/profiles/${localFileName}`;
  }
};

module.exports = { uploadImage, IMAGEKIT_ENABLED };
