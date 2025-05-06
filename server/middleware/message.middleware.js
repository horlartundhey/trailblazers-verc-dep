const multer = require('multer');
const path = require('path');

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/messages');
  },
  filename: function(req, file, cb) {
    cb(null, `message-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allow only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize upload
exports.uploadMessageImage = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB file size limit
  fileFilter: fileFilter
}).single('image');

// Handle image upload
exports.handleMessageImageUpload = (req, res, next) => {
  exports.uploadMessageImage(req, res, function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // If file is uploaded, add the path to the request body
    if (req.file) {
      req.body.image = `/uploads/messages/${req.file.filename}`;
    }
    
    next();
  });
};