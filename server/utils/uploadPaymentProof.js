const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory for payment proofs
const uploadDir = path.join(__dirname, '../uploads/payment-proofs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
  console.log('Created payment proof upload directory:', uploadDir);
} else {
  console.log('Payment proof upload directory exists:', uploadDir);
  try {
    fs.accessSync(uploadDir, fs.constants.W_OK);
    console.log('Payment proof upload directory is writable');
  } catch (err) {
    console.error('Payment proof upload directory is not writable:', err);
  }
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
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
