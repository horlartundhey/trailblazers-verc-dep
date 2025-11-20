const RegionCampus = require('../models/RegionCampus');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Sync regions and campuses from User collection to RegionCampus collection
// @route   POST /api/region-campus/sync
// @access  Private (Admin)
exports.syncRegionsAndCampuses = async (req, res) => {
  try {
    // Get all unique regions and campuses from users
    const users = await User.find({ 
      $or: [{ role: 'Leader' }, { role: 'Member' }] 
    }).select('region campus');

    const regionSet = new Set();
    const campusSet = new Set();

    users.forEach(user => {
      if (user.region) regionSet.add(user.region);
      if (user.campus) campusSet.add(user.campus);
    });

    let regionsCreated = 0;
    let campusesCreated = 0;

    // Helper function to generate unique code
    const generateUniqueCode = async (name, type) => {
      let code = name.substring(0, 3).toUpperCase();
      let counter = 1;
      
      // Check if code exists
      while (await RegionCampus.findOne({ code })) {
        // If exists, try with number suffix
        code = `${name.substring(0, 2).toUpperCase()}${counter}`;
        counter++;
      }
      
      return code;
    };

    // Create regions that don't exist
    for (const regionName of regionSet) {
      const exists = await RegionCampus.findOne({ 
        type: 'Region', 
        name: regionName 
      });

      if (!exists) {
        const code = await generateUniqueCode(regionName, 'Region');
        
        await RegionCampus.create({
          type: 'Region',
          name: regionName,
          code,
          description: `Auto-imported from existing data`,
          createdBy: req.user.id,
          isActive: true
        });
        regionsCreated++;
      }
    }

    // Create campuses that don't exist
    for (const campusName of campusSet) {
      const exists = await RegionCampus.findOne({ 
        type: 'Campus', 
        name: campusName 
      });

      if (!exists) {
        // Try to find a matching region for this campus
        const userWithCampus = await User.findOne({ campus: campusName });
        let parentRegion = null;

        if (userWithCampus && userWithCampus.region) {
          const region = await RegionCampus.findOne({
            type: 'Region',
            name: userWithCampus.region
          });
          if (region) {
            parentRegion = region._id;
          }
        }

        const code = await generateUniqueCode(campusName, 'Campus');

        await RegionCampus.create({
          type: 'Campus',
          name: campusName,
          code,
          description: `Auto-imported from existing data`,
          parentRegion,
          createdBy: req.user.id,
          isActive: true
        });
        campusesCreated++;
      }
    }

    res.json({
      success: true,
      message: 'Sync completed successfully',
      data: {
        regionsCreated,
        campusesCreated,
        totalRegions: regionSet.size,
        totalCampuses: campusSet.size
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync regions and campuses',
      error: error.message
    });
  }
};

// @desc    Get all regions
// @route   GET /api/region-campus/regions
// @access  Private (Admin)
exports.getRegions = async (req, res) => {
  try {
    const regions = await RegionCampus.find({ type: 'Region', isActive: true })
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    // Get user count for each region
    const regionsWithCounts = await Promise.all(
      regions.map(async (region) => {
        const userCount = await User.countDocuments({ region: region.name });
        return {
          ...region.toObject(),
          userCount
        };
      })
    );

    res.json({
      success: true,
      count: regionsWithCounts.length,
      data: regionsWithCounts
    });
  } catch (error) {
    console.error('Get regions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regions',
      error: error.message
    });
  }
};

// @desc    Get all campuses (optionally filter by region)
// @route   GET /api/region-campus/campuses?region=regionId
// @access  Private (Admin)
exports.getCampuses = async (req, res) => {
  try {
    const query = { type: 'Campus', isActive: true };
    
    if (req.query.region) {
      query.parentRegion = req.query.region;
    }

    const campuses = await RegionCampus.find(query)
      .populate('createdBy', 'name email')
      .populate('parentRegion', 'name code')
      .sort({ name: 1 });

    // Get user count for each campus
    const campusesWithCounts = await Promise.all(
      campuses.map(async (campus) => {
        const userCount = await User.countDocuments({ campus: campus.name });
        return {
          ...campus.toObject(),
          userCount
        };
      })
    );

    res.json({
      success: true,
      count: campusesWithCounts.length,
      data: campusesWithCounts
    });
  } catch (error) {
    console.error('Get campuses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campuses',
      error: error.message
    });
  }
};

// @desc    Create a new region
// @route   POST /api/region-campus/regions
// @access  Private (Admin only)
exports.createRegion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array(),
      message: errors.array()[0].msg 
    });
  }

  try {
    const { name, code, description } = req.body;

    // Check if region already exists
    const existingRegion = await RegionCampus.findOne({ 
      name: name.trim(), 
      type: 'Region' 
    });

    if (existingRegion) {
      return res.status(400).json({
        success: false,
        message: 'A region with this name already exists'
      });
    }

    const region = await RegionCampus.create({
      type: 'Region',
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description?.trim() || '',
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Region created successfully',
      data: region
    });
  } catch (error) {
    console.error('Create region error:', error);
    
    let errorMessage = 'Failed to create region';
    if (error.code === 11000) {
      if (error.keyPattern.code) {
        errorMessage = 'A region with this code already exists';
      } else {
        errorMessage = 'A region with this name already exists';
      }
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// @desc    Create a new campus
// @route   POST /api/region-campus/campuses
// @access  Private (Admin only)
exports.createCampus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array(),
      message: errors.array()[0].msg 
    });
  }

  try {
    const { name, code, description, parentRegion } = req.body;

    // Verify parent region exists
    const region = await RegionCampus.findById(parentRegion);
    if (!region || region.type !== 'Region') {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent region'
      });
    }

    // Check if campus already exists
    const existingCampus = await RegionCampus.findOne({ 
      name: name.trim(), 
      type: 'Campus' 
    });

    if (existingCampus) {
      return res.status(400).json({
        success: false,
        message: 'A campus with this name already exists'
      });
    }

    const campus = await RegionCampus.create({
      type: 'Campus',
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description?.trim() || '',
      parentRegion,
      createdBy: req.user.id
    });

    await campus.populate('parentRegion', 'name code');

    res.status(201).json({
      success: true,
      message: 'Campus created successfully',
      data: campus
    });
  } catch (error) {
    console.error('Create campus error:', error);
    
    let errorMessage = 'Failed to create campus';
    if (error.code === 11000) {
      if (error.keyPattern.code) {
        errorMessage = 'A campus with this code already exists';
      } else {
        errorMessage = 'A campus with this name already exists';
      }
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// @desc    Update a region
// @route   PUT /api/region-campus/regions/:id
// @access  Private (Admin only)
exports.updateRegion = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;
    
    const region = await RegionCampus.findOne({ _id: req.params.id, type: 'Region' });
    
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    // Check if new name conflicts with existing region
    if (name && name !== region.name) {
      const existingRegion = await RegionCampus.findOne({
        name: name.trim(),
        type: 'Region',
        _id: { $ne: req.params.id }
      });

      if (existingRegion) {
        return res.status(400).json({
          success: false,
          message: 'A region with this name already exists'
        });
      }
      
      // Update all users with the old region name
      await User.updateMany(
        { region: region.name },
        { region: name.trim() }
      );
    }

    // Update fields
    if (name) region.name = name.trim();
    if (code) region.code = code.toUpperCase().trim();
    if (description !== undefined) region.description = description.trim();
    if (isActive !== undefined) region.isActive = isActive;

    await region.save();

    res.json({
      success: true,
      message: 'Region updated successfully',
      data: region
    });
  } catch (error) {
    console.error('Update region error:', error);
    
    let errorMessage = 'Failed to update region';
    if (error.code === 11000) {
      errorMessage = 'A region with this code already exists';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// @desc    Update a campus
// @route   PUT /api/region-campus/campuses/:id
// @access  Private (Admin only)
exports.updateCampus = async (req, res) => {
  try {
    const { name, code, description, parentRegion, isActive } = req.body;
    
    const campus = await RegionCampus.findOne({ _id: req.params.id, type: 'Campus' });
    
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    // Check if new name conflicts with existing campus
    if (name && name !== campus.name) {
      const existingCampus = await RegionCampus.findOne({
        name: name.trim(),
        type: 'Campus',
        _id: { $ne: req.params.id }
      });

      if (existingCampus) {
        return res.status(400).json({
          success: false,
          message: 'A campus with this name already exists'
        });
      }
      
      // Update all users with the old campus name
      await User.updateMany(
        { campus: campus.name },
        { campus: name.trim() }
      );
    }

    // Verify parent region if changed
    if (parentRegion && parentRegion !== campus.parentRegion.toString()) {
      const region = await RegionCampus.findById(parentRegion);
      if (!region || region.type !== 'Region') {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent region'
        });
      }
      campus.parentRegion = parentRegion;
    }

    // Update fields
    if (name) campus.name = name.trim();
    if (code) campus.code = code.toUpperCase().trim();
    if (description !== undefined) campus.description = description.trim();
    if (isActive !== undefined) campus.isActive = isActive;

    await campus.save();
    await campus.populate('parentRegion', 'name code');

    res.json({
      success: true,
      message: 'Campus updated successfully',
      data: campus
    });
  } catch (error) {
    console.error('Update campus error:', error);
    
    let errorMessage = 'Failed to update campus';
    if (error.code === 11000) {
      errorMessage = 'A campus with this code already exists';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// @desc    Delete a region
// @route   DELETE /api/region-campus/regions/:id
// @access  Private (Admin only)
exports.deleteRegion = async (req, res) => {
  try {
    const region = await RegionCampus.findOne({ _id: req.params.id, type: 'Region' });
    
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    // Check if region has users
    const userCount = await User.countDocuments({ region: region.name });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete region. ${userCount} user(s) are assigned to this region.`
      });
    }

    // Check if region has campuses
    const campusCount = await RegionCampus.countDocuments({ 
      type: 'Campus', 
      parentRegion: region._id 
    });
    if (campusCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete region. ${campusCount} campus(es) are linked to this region.`
      });
    }

    await region.deleteOne();

    res.json({
      success: true,
      message: 'Region deleted successfully'
    });
  } catch (error) {
    console.error('Delete region error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete region',
      error: error.message
    });
  }
};

// @desc    Delete a campus
// @route   DELETE /api/region-campus/campuses/:id
// @access  Private (Admin only)
exports.deleteCampus = async (req, res) => {
  try {
    const campus = await RegionCampus.findOne({ _id: req.params.id, type: 'Campus' });
    
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    // Check if campus has users
    const userCount = await User.countDocuments({ campus: campus.name });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete campus. ${userCount} user(s) are assigned to this campus.`
      });
    }

    await campus.deleteOne();

    res.json({
      success: true,
      message: 'Campus deleted successfully'
    });
  } catch (error) {
    console.error('Delete campus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campus',
      error: error.message
    });
  }
};
