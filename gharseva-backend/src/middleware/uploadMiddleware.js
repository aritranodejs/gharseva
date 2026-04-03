const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine subdirectory based on fieldname (or fallback to 'others')
    const subDirName = file.fieldname ? file.fieldname : 'others';
    const dynamicDir = path.join(uploadDir, subDirName);
    
    // Ensure the subdirectory exists
    if (!fs.existsSync(dynamicDir)) {
      fs.mkdirSync(dynamicDir, { recursive: true });
    }
    
    cb(null, dynamicDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

module.exports = upload;
