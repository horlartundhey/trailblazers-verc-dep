const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use memory storage for production (Vercel), disk storage for development
const storage = process.env.NODE_ENV === 'production' || process.env.VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/payment-proofs');
        // Create directory if it doesn't exist (development only)
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
          console.log('Created payment proof upload directory:', uploadDir);
        }
        cb(null, uploadDir);
      },
      filename: function(req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `payment-proof-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });

const fileFilter = (req, file, cb) => {
  // Accept images and PDF files for payment proofs
  const filetypes = /jpeg|jpg|png|gif|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image\/(jpeg|jpg|png|gif)|application\/pdf/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images (jpeg, jpg, png, gif) and PDF files are allowed for payment proofs'));
};

const uploadPaymentProof = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for payment proofs
  fileFilter: fileFilter
});

module.exports = uploadPaymentProof;
