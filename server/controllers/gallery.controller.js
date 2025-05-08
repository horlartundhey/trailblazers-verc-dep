// controllers/galleryController.js

const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const Gallery = require('../models/Gallery');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Upload a new gallery image
// @route   POST /api/gallery
// @access  Private (Admin only)
const uploadImage = asyncHandler(async (req, res) => {
  const { category, caption, collection } = req.body;
  const file = req.file;

  if (!file || !category || !caption || !collection) {
    res.status(400);
    throw new Error('Please provide image, category, caption, and collection');
  }

  // Validate category
  const validCategories = ['worship', 'baptism', 'community', 'youth', 'missions'];
  if (!validCategories.includes(category)) {
    res.status(400);
    throw new Error('Invalid category');
  }

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'trailblazer/gallery',
      resource_type: 'auto',
    });

    // Remove temporary file
    fs.unlinkSync(file.path);

    // Save to database
    const galleryImage = await Gallery.create({
      src: result.secure_url,
      category,
      caption,
      collection,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: galleryImage,
    });
  } catch (error) {
    // Clean up temporary file if it exists
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    res.status(500);
    throw new Error('Error uploading image: ' + error.message);
  }
});

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Public
const getImages = asyncHandler(async (req, res) => {
  const images = await Gallery.find()
    .populate('createdBy', 'name')
    .sort('-createdAt');
  res.status(200).json({
    success: true,
    data: images,
  });
});

// @desc    Get images by collection
// @route   GET /api/gallery/collection/:collection
// @access  Public
const getImagesByCollection = asyncHandler(async (req, res) => {
  const images = await Gallery.find({ collection: req.params.collection })
    .populate('createdBy', 'name')
    .sort('-createdAt');
  res.status(200).json({
    success: true,
    data: images,
  });
});

// @desc    Delete a gallery image
// @route   DELETE /api/gallery/:id
// @access  Private (Admin only)
const deleteImage = asyncHandler(async (req, res) => {
  const image = await Gallery.findById(req.params.id);

  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }

  // Check authorization
  if (image.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized to delete this image');
  }

  // Delete from Cloudinary
  const publicId = image.src.split('/').pop().split('.')[0];
  await cloudinary.uploader.destroy(`gallery/${publicId}`);

  // Delete from database
  await Gallery.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
  });
});

module.exports = {
  uploadImage,
  getImages,
  getImagesByCollection,
  deleteImage,
};