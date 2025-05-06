const express = require('express');
const router = express.Router();
const { uploadImage, getImages, getImagesByCollection, deleteImage } = require('../controllers/gallery.controller');

const multer = require('multer');
const { protect, authorize } = require('../middleware/auth.middleware');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(file.originalname.split('.').pop().toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('File type not supported'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Routes
router.route('/')
  .get(getImages)
  .post(protect, authorize('Admin', 'Leader'), upload.single('image'), uploadImage);

router.get('/collection/:collection', getImagesByCollection);

router.delete('/:id', protect, authorize('Admin', 'Leader'), deleteImage);

module.exports = router;