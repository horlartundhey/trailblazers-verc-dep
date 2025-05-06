const multer = require('multer');
const path = require('path');
// Add this to your multer configuration file
const fs = require('fs');

// Create upload directory with proper permissions
const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
  console.log('Created upload directory:', uploadDir);
} else {
  console.log('Upload directory exists:', uploadDir);
  // Check if writable
  try {
    fs.accessSync(uploadDir, fs.constants.W_OK);
    console.log('Upload directory is writable');
  } catch (err) {
    console.error('Upload directory is not writable:', err);
  }
}

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      // The userId from req.body isn't available here yet because multer processes before body parser
      // Instead, we'll generate a unique name and rely on the authenticated user later
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `user-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images (jpeg, jpg, png, gif) are allowed'));
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Increase to 10MB
    fileFilter: fileFilter
  });

module.exports = upload;