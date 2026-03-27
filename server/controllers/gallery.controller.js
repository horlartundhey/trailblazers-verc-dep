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
  const { category, caption, collection, programTitle, programDate, description, testimony, attendees, healings, messageShared, isPublic } = req.body;
  const file = req.file;

  if (!file || !category || !caption || !collection || !programTitle || !programDate) {
    res.status(400);
    throw new Error('Please provide image, category, caption, collection, program title, and program date');
  }

  // Validate category
  const validCategories = ['worship', 'baptism', 'community', 'youth', 'missions'];
  if (!validCategories.includes(category)) {
    res.status(400);
    throw new Error('Invalid category');
  }

  try {
    let imageUrl;

    if (process.env.NODE_ENV === 'production') {
      // Upload buffer to Cloudinary in production
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'trailblazer/gallery', resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
      imageUrl = result.secure_url;
    } else {
      // Use local file path in development
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'trailblazer/gallery',
        resource_type: 'auto',
      });
      imageUrl = result.secure_url;
      // Clean up local file
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }

    // Save to database
    const galleryImage = await Gallery.create({
      src: imageUrl,
      category,
      caption,
      collection,
      programTitle,
      programDate,
      description: description || '',
      testimony: testimony || '',
      attendees: attendees || 0,
      healings: healings || 0,
      messageShared: messageShared || '',
      isPublic: isPublic !== undefined ? isPublic : true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: galleryImage,
    });
  } catch (error) {
    // Clean up local file if it exists in development
    if (!process.env.NODE_ENV === 'production' && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    console.error('Gallery upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image: ' + error.message
    });
  }
});

// @desc    Get all gallery images (public only)
// @route   GET /api/gallery
// @access  Public
const getImages = asyncHandler(async (req, res) => {
  const images = await Gallery.find({ isPublic: true })
    .populate('createdBy', 'name')
    .sort('-createdAt');
  res.status(200).json({
    success: true,
    data: images,
  });
});

// @desc    Get all programs with grouped images
// @route   GET /api/gallery/programs
// @access  Public
const getPrograms = async (req, res) => {
  try {
    console.log('Fetching gallery programs...');
    const programs = await Gallery.aggregate([
      { $match: { isPublic: true } },
      {
        $group: {
          _id: '$programTitle',
          programTitle: { $first: '$programTitle' },
          programDate: { $first: '$programDate' },
          description: { $first: '$description' },
          testimony: { $first: '$testimony' },
          attendees: { $first: '$attendees' },
          healings: { $first: '$healings' },
          messageShared: { $first: '$messageShared' },
          category: { $first: '$category' },
          collection: { $first: '$collection' },
          thumbnailImage: { $first: '$src' },
          images: {
            $push: {
              _id: '$_id',
              src: '$src',
              caption: '$caption',
              category: '$category',
              videoUrl: '$videoUrl',
            }
          },
          createdAt: { $first: '$createdAt' }
        }
      },
      { $sort: { programDate: -1 } }
    ]);

    console.log(`Successfully fetched ${programs.length} programs`);
    res.status(200).json({
      success: true,
      data: programs,
    });
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching programs: ' + error.message
    });
  }
};

// @desc    Get all programs for authenticated users (public + private)
// @route   GET /api/gallery/member/programs
// @access  Private (any authenticated user)
const getMemberPrograms = async (req, res) => {
  try {
    const programs = await Gallery.aggregate([
      {
        $group: {
          _id: '$programTitle',
          programTitle: { $first: '$programTitle' },
          programDate: { $first: '$programDate' },
          description: { $first: '$description' },
          testimony: { $first: '$testimony' },
          attendees: { $first: '$attendees' },
          healings: { $first: '$healings' },
          messageShared: { $first: '$messageShared' },
          category: { $first: '$category' },
          collection: { $first: '$collection' },
          isPublic: { $first: '$isPublic' },
          thumbnailImage: { $first: '$src' },
          images: {
            $push: {
              _id: '$_id',
              src: '$src',
              caption: '$caption',
              category: '$category',
              videoUrl: '$videoUrl',
            }
          },
          createdAt: { $first: '$createdAt' }
        }
      },
      { $sort: { programDate: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: programs,
    });
  } catch (error) {
    console.error('Get member programs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching programs: ' + error.message
    });
  }
};

// @desc    Get all programs with grouped images (admin - all including private)
// @route   GET /api/gallery/admin/programs
// @access  Private (Admin only)
const getAdminPrograms = async (req, res) => {
  try {
    const programs = await Gallery.aggregate([
      {
        $group: {
          _id: '$programTitle',
          programTitle: { $first: '$programTitle' },
          programDate: { $first: '$programDate' },
          description: { $first: '$description' },
          testimony: { $first: '$testimony' },
          attendees: { $first: '$attendees' },
          healings: { $first: '$healings' },
          messageShared: { $first: '$messageShared' },
          category: { $first: '$category' },
          collection: { $first: '$collection' },
          isPublic: { $first: '$isPublic' },
          thumbnailImage: { $first: '$src' },
          images: {
            $push: {
              _id: '$_id',
              src: '$src',
              caption: '$caption',
              category: '$category',
              isPublic: '$isPublic',
              videoUrl: '$videoUrl',
            }
          },
          imageCount: { $sum: 1 },
          createdAt: { $first: '$createdAt' }
        }
      },
      { $sort: { programDate: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: programs,
    });
  } catch (error) {
    console.error('Get admin programs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching programs: ' + error.message
    });
  }
};

// @desc    Get images by collection
// @route   GET /api/gallery/collection/:collection
// @access  Public
const getImagesByCollection = asyncHandler(async (req, res) => {
  const images = await Gallery.find({ 
    collection: req.params.collection,
    isPublic: true 
  })
    .populate('createdBy', 'name')
    .sort('-createdAt');
  res.status(200).json({
    success: true,
    data: images,
  });
});

// @desc    Update album-level fields for all images in a collection
// @route   PATCH /api/gallery/program/:collection
// @access  Private (Admin only)
const updateProgram = asyncHandler(async (req, res) => {
  const { collection } = req.params;
  const { programTitle, programDate, description, testimony, attendees, healings, messageShared, isPublic } = req.body;

  const update = {};
  if (programTitle !== undefined) update.programTitle = programTitle;
  if (programDate !== undefined) update.programDate = programDate;
  if (description !== undefined) update.description = description;
  if (testimony !== undefined) update.testimony = testimony;
  if (attendees !== undefined) update.attendees = Number(attendees);
  if (healings !== undefined) update.healings = Number(healings);
  if (messageShared !== undefined) update.messageShared = messageShared;
  if (isPublic !== undefined) update.isPublic = isPublic;

  if (Object.keys(update).length === 0) {
    res.status(400);
    throw new Error('No fields to update');
  }

  const result = await Gallery.updateMany({ collection }, { $set: update });

  res.status(200).json({
    success: true,
    message: `Updated ${result.modifiedCount} images`,
  });
});

// @desc    Add a YouTube video link to a gallery album
// @route   POST /api/gallery/video
// @access  Private (Admin, Leader)
const uploadVideo = asyncHandler(async (req, res) => {
  const { category, caption, collection, programTitle, programDate, description, testimony, attendees, healings, messageShared, isPublic, videoUrl } = req.body;

  if (!videoUrl || !category || !caption || !collection || !programTitle || !programDate) {
    res.status(400);
    throw new Error('Please provide videoUrl, category, caption, collection, program title, and program date');
  }

  const youtubeIdMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (!youtubeIdMatch) {
    res.status(400);
    throw new Error('Invalid YouTube URL');
  }
  const videoId = youtubeIdMatch[1];
  const thumbnailSrc = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const validCategories = ['worship', 'baptism', 'community', 'youth', 'missions'];
  if (!validCategories.includes(category)) {
    res.status(400);
    throw new Error('Invalid category');
  }

  const galleryItem = await Gallery.create({
    src: thumbnailSrc,
    videoUrl,
    category,
    caption,
    collection,
    programTitle,
    programDate,
    description: description || '',
    testimony: testimony || '',
    attendees: attendees || 0,
    healings: healings || 0,
    messageShared: messageShared || '',
    isPublic: isPublic !== undefined ? isPublic : true,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: galleryItem,
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
  getPrograms,
  getMemberPrograms,
  getAdminPrograms,
  getImagesByCollection,
  deleteImage,
  updateProgram,
  uploadVideo,
};