const Event = require('../models/Events');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const fs = require('fs');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Admin, Leader)
exports.createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, description, date, location, capacity, regions, campuses, image } = req.body;

    // Fetch all unique regions from users collection
    const allUsers = await User.find();
    const allRegions = [...new Set(allUsers
      .filter(user => user.region)
      .map(user => user.region))];
      
    // Fetch all unique campuses from users collection
    const allCampuses = [...new Set(allUsers
      .filter(user => user.campus)
      .map(user => user.campus))];

    // Use provided regions or default to all regions
    const finalRegions = regions && regions.length > 0 
      ? regions 
      : allRegions;

    // Use provided campuses or default to all campuses
    const finalCampuses = campuses && campuses.length > 0
      ? campuses
      : allCampuses;

    // Create event with all regions/campuses if none selected
    const event = await Event.create({
      name,
      description,
      date,
      location,
      capacity,
      image: image || null,
      regions: finalRegions,
      campuses: finalCampuses,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Private (All roles)
exports.getEvents = async (req, res) => {
  try {
    let query = {};
    
    // For Member, only show events that they are eligible for (based on region/campus)
    if (req.user.role === 'Member') {
      query = {
        $or: [
          { regions: { $size: 0 } }, // Events with no region restriction
          { regions: req.user.region }, // Events available in member's region
          { 
            $and: [
              { regions: { $size: 0 } },
              { campuses: { $size: 0 } }
            ]
          }, // Events with no restrictions
          { 
            $and: [
              { regions: req.user.region },
              { campuses: { $size: 0 } }
            ]
          }, // Events for user's region with no campus restriction
          { 
            $and: [
              { regions: { $size: 0 } },
              { campuses: req.user.campus }
            ]
          }, // Events for user's campus with no region restriction
          { 
            $and: [
              { regions: req.user.region },
              { campuses: req.user.campus }
            ]
          } // Events specifically for user's region and campus
        ]
      };
    }
    
    // For Leader, show all events (they can see events for their region/campus)
    // and events they've created
    if (req.user.role === 'Leader') {
      query = {
        $or: [
          { createdBy: req.user._id }, // Events created by this leader
          { regions: { $size: 0 } }, // Events with no region restriction
          { regions: req.user.region }, // Events in leader's region
          { 
            $and: [
              { regions: { $size: 0 } },
              { campuses: { $size: 0 } }
            ]
          }, // Events with no restrictions
          { 
            $and: [
              { regions: req.user.region },
              { campuses: { $size: 0 } }
            ]
          }, // Events for leader's region with no campus restriction
          { 
            $and: [
              { regions: { $size: 0 } },
              { campuses: req.user.campus }
            ]
          }, // Events for leader's campus with no region restriction
          { 
            $and: [
              { regions: req.user.region },
              { campuses: req.user.campus }
            ]
          } // Events specifically for leader's region and campus
        ]
      };
    }
    
    // Admin sees all events
    
    const events = await Event.find(query)
      .sort({ date: 1 })
      .populate('createdBy', 'name email role');
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events',
      error: error.message
    });
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Private (All roles, with restrictions)
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('registeredMembers.memberId', 'name email role region campus');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if member is allowed to see this event
    if (req.user.role === 'Member') {
      const isAllowedRegion = event.regions.length === 0 || event.regions.includes(req.user.region);
      const isAllowedCampus = event.campuses.length === 0 || event.campuses.includes(req.user.campus);
      
      if (!isAllowedRegion || !isAllowedCampus) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to view this event'
        });
      }
    }
    
    // Check if leader is allowed to see this event (unless they created it)
    if (req.user.role === 'Leader' && event.createdBy._id.toString() !== req.user._id.toString()) {
      const isAllowedRegion = event.regions.length === 0 || event.regions.includes(req.user.region);
      const isAllowedCampus = event.campuses.length === 0 || event.campuses.includes(req.user.campus);
      
      if (!isAllowedRegion || !isAllowedCampus) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to view this event'
        });
      }
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event',
      error: error.message
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin, Leader who created the event)
exports.updateEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if leader is the creator of this event
    if (req.user.role === 'Leader' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator of this event can update it'
      });
    }
    
    const { name, description, date, location, capacity, regions, campuses, image } = req.body;
    
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        date,
        location,
        capacity,
        image,
        regions: regions || [],
        campuses: campuses || [],
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin, Leader who created the event)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if leader is the creator of this event
    if (req.user.role === 'Leader' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator of this event can delete it'
      });
    }
    
    await event.remove();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message
    });
  }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private (Members only)
exports.registerForEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if member is allowed to register for this event
    if (req.user.role === 'Member') {
      const isAllowedRegion = event.regions.length === 0 || event.regions.includes(req.user.region);
      const isAllowedCampus = event.campuses.length === 0 || event.campuses.includes(req.user.campus);
      
      if (!isAllowedRegion || !isAllowedCampus) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to register for this event'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only members can register for events'
      });
    }
    
    // Register for the event
    const status = event.registerMember(req.user._id);
    await event.save();
    
    res.json({
      success: true,
      data: {
        status,
        message: `Registration ${status === 'Confirmed' ? 'confirmed' : 'added to waitlist'}`
      }
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      error: error.message
    });
  }
};

// @desc    Cancel registration for an event
// @route   PUT /api/events/:id/cancel
// @access  Private (Members only)
exports.cancelRegistration = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Find the member's registration
    const registration = event.registeredMembers.find(
      m => m.memberId.toString() === req.user._id.toString()
    );
    
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this event'
      });
    }
    
    // Update status to cancelled
    registration.status = 'Cancelled';
    await event.save();
    
    // If someone was waitlisted, move them to confirmed
    if (event.registeredMembers.filter(m => m.status === 'Confirmed').length < event.capacity) {
      // Find the first waitlisted member (sorted by registration date)
      const waitlisted = event.registeredMembers
        .filter(m => m.status === 'Waitlisted')
        .sort((a, b) => a.registrationDate - b.registrationDate);
      
      if (waitlisted.length > 0) {
        waitlisted[0].status = 'Confirmed';
        await event.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel registration',
      error: error.message
    });
  }
};

// @desc    Get public events (no authentication required)
// @route   GET /api/public/events
// @access  Public
exports.getPublicEvents = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const events = await Event.find({
      date: { $gte: today },
      createdBy: { $in: await User.find({ role: 'Admin' }).select('_id') }, // Only admin-created events
    })
      .sort({ date: 1 })
      .select('-registeredMembers -__v');
    
    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('Get public events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events',
      error: error.message,
    });
  }
};


// @desc    Register a guest for an event
// @route   POST /api/events/:id/guest-register
// @access  Public
exports.registerGuest = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const { name, email, phone } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }
    
    // Create a guest registration entry
    // First, check if this guest is already registered
    const existingRegistration = event.guestRegistrations.find(
      guest => guest.email.toLowerCase() === email.toLowerCase()
    );
    
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }
    
    // Register the guest
    let registrationStatus = 'Confirmed';
    
    // Check if the event is at capacity
    const confirmedCount = event.registeredMembers.filter(m => m.status === 'Confirmed').length + 
                         event.guestRegistrations.filter(g => g.status === 'Confirmed').length;
    
    if (confirmedCount >= event.capacity) {
      registrationStatus = 'Waitlisted';
    }
    
    // Add to guest registrations
    event.guestRegistrations.push({
      name,
      email,
      phone: phone || '',
      status: registrationStatus,
      registrationDate: Date.now()
    });
    
    await event.save();
    
    res.json({
      success: true,
      data: {
        status: registrationStatus,
        message: `Registration ${registrationStatus === 'Confirmed' ? 'confirmed' : 'added to waitlist'}`
      }
    });
  } catch (error) {
    console.error('Guest registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      error: error.message
    });
  }
};

