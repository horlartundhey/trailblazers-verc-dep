const express = require('express');
const router = express.Router();
const { uploadImage, getImages, getPrograms, getMemberPrograms, getAdminPrograms, getImagesByCollection, deleteImage } = require('../controllers/gallery.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/gallery.middleware');

// Public routes
router.get('/', getImages);
router.get('/programs', getPrograms);
router.get('/collection/:collection', getImagesByCollection);

// Authenticated user routes (all roles)
router.get('/member/programs', protect, getMemberPrograms);

// Admin-only routes
router.get('/admin/programs', protect, authorize('Admin'), getAdminPrograms);

// Protected routes (Admin/Leader only)
router.post('/', protect, authorize('Admin', 'Leader'), upload.single('image'), uploadImage);
router.delete('/:id', protect, authorize('Admin', 'Leader'), deleteImage);

module.exports = router;