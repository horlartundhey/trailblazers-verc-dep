const express = require('express');
const router = express.Router();
const { uploadImage, getImages, getImagesByCollection, deleteImage } = require('../controllers/gallery.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/gallery.middleware');

// Routes
router.route('/')
  .get(getImages)
  .post(protect, authorize('Admin', 'Leader'), upload.single('image'), uploadImage);

router.get('/collection/:collection', getImagesByCollection);

router.delete('/:id', protect, authorize('Admin', 'Leader'), deleteImage);

module.exports = router;