const multer = require('multer');
const fs = require('fs');
const path = require('path');

let uploadEventImage;

if (process.env.NODE_ENV === 'production') {
  // Use memory storage for Vercel/production
  uploadEventImage = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
      }
    }
  }).single('image');
} else {
  // Use disk storage in development
  const uploadDir = path.join(__dirname, '../uploads/events');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `event-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
  uploadEventImage = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
      }
    }
  }).single('image');
}

exports.handleEventImageUpload = (req, res, next) => {
  uploadEventImage(req, res, function(err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: err.code === 'LIMIT_FILE_SIZE' 
            ? 'File is too large. Maximum size is 5MB.' 
            : 'Upload error occurred'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed'
        });
      }
    }
    // In dev, set req.body.image to file path; in prod, controller will handle Cloudinary
    if (req.file && process.env.NODE_ENV !== 'production') {
      req.body.image = path.join('/uploads/events', req.file.filename).replace(/\\/g, '/');
    }
    next();
  });
};