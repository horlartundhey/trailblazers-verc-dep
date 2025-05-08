const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../uploads/events');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine for multer with more robust filename generation
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate a unique filename to prevent overwriting
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `event-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Enhanced file filter with more detailed validation
const fileFilter = (req, file, cb) => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// Initialize upload with more comprehensive configuration
const uploadEventImage = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Limit to single file upload
  },
  fileFilter: fileFilter
}).single('image');

// Middleware to handle event image upload
exports.handleEventImageUpload = (req, res, next) => {
  uploadEventImage(req, res, function(err) {
    if (err) {
      // Handle specific multer errors
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
    
    // If file is uploaded, add the path to the request body
    if (req.file) {
      // Use absolute path for the image URL
      req.body.image = path.join('/uploads/events', req.file.filename).replace(/\\/g, '/');
    }
    
    next();
  });
};