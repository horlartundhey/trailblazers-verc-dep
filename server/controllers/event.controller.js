const Event = require('../models/Events');
const User = require('../models/User');
const EventAttendance = require('../models/EventAttendance');
const { validationResult } = require('express-validator');
const { sendEventNotification } = require('../utils/emailService');

const fs = require('fs');
const cloudinary = require('../utils/cloudinary');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Admin, Leader)
exports.createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {    const { 
      name, 
      description, 
      date, 
      startTime, 
      endTime,
      registrationStartDate,
      registrationEndDate,
      location, 
      capacity,
      registrationAccessControl, 
      regions, 
      campuses 
    } = req.body;
    let imageUrl = null;

    // Parse regions and campuses if they're strings (from FormData)
    let parsedRegions = regions;
    let parsedCampuses = campuses;
    
    console.log('CREATE - Raw regions:', regions, 'Type:', typeof regions);
    console.log('CREATE - Raw campuses:', campuses, 'Type:', typeof campuses);
    
    if (typeof regions === 'string') {
      try {
        parsedRegions = JSON.parse(regions);
        console.log('CREATE - Parsed regions:', parsedRegions);
      } catch (e) {
        console.log('CREATE - Failed to parse regions:', e.message);
        parsedRegions = regions ? [regions] : [];
      }
    }
    
    if (typeof campuses === 'string') {
      try {
        parsedCampuses = JSON.parse(campuses);
        console.log('CREATE - Parsed campuses:', parsedCampuses);
      } catch (e) {
        console.log('CREATE - Failed to parse campuses:', e.message);
        parsedCampuses = campuses ? [campuses] : [];
      }
    }

    // Handle image upload
    if (req.file) {
      if (process.env.NODE_ENV === 'production') {
        // Upload buffer to Cloudinary
        const uploadResult = await cloudinary.uploader.upload_stream(
          { folder: 'trailblazer/events', resource_type: 'auto' },
          (error, result) => {
            if (error) throw error;
            imageUrl = result.secure_url;
          }
        );
        // Use a Promise to wait for upload_stream
        await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'trailblazer/events', resource_type: 'auto' },
            (error, result) => {
              if (error) return reject(error);
              imageUrl = result.secure_url;
              resolve();
            }
          );
          stream.end(req.file.buffer);
        });
      } else {
        // In dev, use local file path
        imageUrl = req.body.image || null;
      }
    }

    // Fetch all unique regions from users collection
    const allUsers = await User.find();
    const allRegions = [...new Set(allUsers.filter(user => user.region).map(user => user.region))];
    const allCampuses = [...new Set(allUsers.filter(user => user.campus).map(user => user.campus))];
    const finalRegions = regions && regions.length > 0 ? regions : allRegions;
    const finalCampuses = campuses && campuses.length > 0 ? campuses : allCampuses;

    // Validate dates
    const now = new Date();
    const eventDate = new Date(date);
    const regStartDate = new Date(registrationStartDate);
    const regEndDate = new Date(registrationEndDate);

    if (regStartDate >= regEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Registration start date must be before registration end date'
      });
    }

    if (regEndDate >= eventDate) {
      return res.status(400).json({
        success: false,
        message: 'Registration must end before the event date'
      });
    }

    // Create event
    const event = new Event({
      name,
      description,
      date: eventDate,
      startTime,
      endTime,
      registrationStartDate: regStartDate,
      registrationEndDate: regEndDate,
      location,
      capacity,
      registrationAccessControl,
      regions: parsedRegions || [],
      campuses: parsedCampuses || [],
      createdBy: req.user._id,
      image: imageUrl
    });

    await event.save();

    // Note: In development, we keep the file on disk to serve it
    // In production, file is in memory only and goes to Cloudinary

    // Send event notifications to eligible users
    try {
      // Find users who should receive notification based on regions and campuses
      let notificationQuery = {};
      
      if (event.regions && event.regions.length > 0) {
        notificationQuery.region = { $in: event.regions };
      }
      
      if (event.campuses && event.campuses.length > 0) {
        notificationQuery.campus = { $in: event.campuses };
      }
      
      // If no specific regions/campuses, notify all users
      const eligibleUsers = await User.find(notificationQuery).select('email');
      const recipientEmails = eligibleUsers.map(user => user.email);
      
      if (recipientEmails.length > 0) {
        const emailResult = await sendEventNotification(recipientEmails, {
          title: event.name,
          description: event.description,
          date: event.date,
          location: event.location,
          registrationLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${event._id}`
        });
        
        if (emailResult.success) {
          console.log(`Event notifications sent to ${emailResult.recipientCount} users`);
        } else {
          console.error('Failed to send event notifications:', emailResult.error);
          // Don't fail event creation if emails fail
        }
      }
    } catch (emailError) {
      console.error('Error sending event notifications:', emailError);
      // Continue with success response even if email fails
    }

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    if (req.file && req.file.path && process.env.NODE_ENV !== 'production') {
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
  try {    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('registeredMembers.memberId', 'name email role region campus')
      .populate('attendance.user', 'name email role');
    
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
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
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

    const { 
      name, 
      description, 
      date, 
      startTime,
      endTime,
      registrationStartDate,
      registrationEndDate,
      location, 
      capacity, 
      registrationAccessControl,
      regions, 
      campuses 
    } = req.body;
    let imageUrl = event.image;

    // Parse regions and campuses if they're strings (from FormData)
    let parsedRegions = regions;
    let parsedCampuses = campuses;
    
    console.log('UPDATE - Raw regions:', regions, 'Type:', typeof regions);
    console.log('UPDATE - Raw campuses:', campuses, 'Type:', typeof campuses);
    
    if (typeof regions === 'string') {
      try {
        parsedRegions = JSON.parse(regions);
        console.log('UPDATE - Parsed regions:', parsedRegions);
      } catch (e) {
        console.log('UPDATE - Failed to parse regions:', e.message);
        parsedRegions = regions ? [regions] : [];
      }
    }
    
    if (typeof campuses === 'string') {
      try {
        parsedCampuses = JSON.parse(campuses);
        console.log('UPDATE - Parsed campuses:', parsedCampuses);
      } catch (e) {
        console.log('UPDATE - Failed to parse campuses:', e.message);
        parsedCampuses = campuses ? [campuses] : [];
      }
    }

    // Handle image upload
    console.log('Update event - req.file:', req.file);
    console.log('Update event - req.body.image:', req.body.image);
    console.log('Update event - current event.image:', event.image);
    
    if (req.file) {
      if (process.env.NODE_ENV === 'production') {
        await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'trailblazer/events', resource_type: 'auto' },
            (error, result) => {
              if (error) return reject(error);
              imageUrl = result.secure_url;
              resolve();
            }
          );
          stream.end(req.file.buffer);
        });
      } else {
        // In dev, the middleware already set req.body.image to the file path
        imageUrl = req.body.image;
        console.log('Update event - new imageUrl from req.body.image:', imageUrl);
      }
    }
    
    console.log('Update event - final imageUrl to save:', imageUrl);

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        date,
        startTime,
        endTime,
        registrationStartDate,
        registrationEndDate,
        location,
        capacity,
        registrationAccessControl,
        image: imageUrl,
        regions: parsedRegions || event.regions,
        campuses: parsedCampuses || event.campuses,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    // Note: In development, we keep the file on disk to serve it
    // In production, file is in memory only and goes to Cloudinary

    res.json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    // Only clean up file on error in production (memory storage)
    // In development, keep the file even on error for debugging
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
    
    await event.deleteOne();
    
    res.json({
      success: true,
      message: 'Event deleted successfully',
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
    // First, get the event without validation
    let event = await Event.findById(req.params.id)
      .select('regions campuses registrationAccessControl registrationStartDate registrationEndDate capacity registeredMembers guestRegistrations')
      .lean();
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check access control
    if (event.registrationAccessControl === 'Leaders' && req.user.role !== 'Leader') {
      return res.status(403).json({
        success: false,
        message: 'This event is only open to Leaders'
      });
    }

    if (event.registrationAccessControl === 'Members' && req.user.role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'This event is only open to Members and Leaders'
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
    } else if (req.user.role !== 'Leader') {
      return res.status(403).json({
        success: false,
        message: 'Only members and leaders can register for events'
      });
    }

    // Check if already registered
    const existingRegistration = event.registeredMembers?.find(
      m => m.memberId?.toString() === req.user._id.toString()
    );
    
    if (existingRegistration && existingRegistration.status !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check registration period
    const now = new Date();
    if (now < new Date(event.registrationStartDate)) {
      return res.status(400).json({
        success: false,
        message: 'Registration has not started yet'
      });
    }
    if (now > new Date(event.registrationEndDate)) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed'
      });
    }

    // Count confirmed registrations
    const confirmedMembers = (event.registeredMembers || []).filter(
      m => m.status === 'Confirmed'
    ).length;
    
    const confirmedGuests = (event.guestRegistrations || []).filter(
      g => g.status === 'Confirmed'
    ).length;
    
    const totalConfirmed = confirmedMembers + confirmedGuests;
    const status = totalConfirmed >= event.capacity ? 'Waitlisted' : 'Confirmed';

    let result;
    if (existingRegistration) {
      // Update existing registration
      result = await Event.findOneAndUpdate(
        { 
          _id: event._id,
          'registeredMembers.memberId': req.user._id
        },
        { 
          $set: {
            'registeredMembers.$.status': status,
            'registeredMembers.$.registrationDate': now
          }
        },
        { new: true }
      ).select('registeredMembers');
    } else {
      // Add new registration
      result = await Event.findByIdAndUpdate(
        event._id,
        {
          $push: {
            registeredMembers: {
              memberId: req.user._id,
              status,
              registrationDate: now
            }
          }
        },
        { new: true }
      ).select('registeredMembers');
    }

    if (!result) {
      throw new Error('Failed to update registration');
    }

    // Find the updated registration
    const updatedRegistration = result.registeredMembers.find(
      m => m.memberId.toString() === req.user._id.toString()
    );

    // Create EventAttendance record for Leaders
    if (req.user.role === 'Leader' && updatedRegistration.status !== 'Cancelled') {
      try {
        // Fetch event name and date (not included in lean query above)
        const eventDetails = await Event.findById(req.params.id).select('name date');
        const existingAttendance = await EventAttendance.findOne({
          event: req.params.id,
          phone: req.user.phone || req.user._id.toString(),
        });
        if (!existingAttendance) {
          await EventAttendance.create({
            name: req.user.name,
            phone: req.user.phone || 'N/A',
            location: req.user.campus || req.user.region || 'N/A',
            invitedBy: 'Self (Leader)',
            event: req.params.id,
            eventName: eventDetails?.name || 'Event',
            eventDate: eventDetails?.date || new Date(),
            status: 'Registered',
          });
        }
      } catch (attendanceErr) {
        // Non-blocking - log but don't fail the registration
        console.error('Failed to create EventAttendance for leader:', attendanceErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        status: updatedRegistration.status,
        message: updatedRegistration.status === 'Confirmed'
          ? 'You are now registered for this event'
          : 'You have been added to the waitlist'
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

// @desc    Register guest for an event (no authentication required)
// @route   POST /api/events/:id/register-guest
// @access  Public
exports.registerGuestForEvent = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required'
      });
    }

    const event = await Event.findById(req.params.id)
      .select('name registrationAccessControl registrationStartDate registrationEndDate capacity registeredMembers guestRegistrations');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event allows public registration
    if (event.registrationAccessControl !== 'Public') {
      return res.status(403).json({
        success: false,
        message: 'This event is not open for public registration. Please log in to register.'
      });
    }

    // Check registration period
    const now = new Date();
    if (now < new Date(event.registrationStartDate)) {
      return res.status(400).json({
        success: false,
        message: 'Registration has not started yet'
      });
    }
    if (now > new Date(event.registrationEndDate)) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed'
      });
    }

    // Check if guest already registered with this phone number
    const existingGuest = event.guestRegistrations?.find(
      g => g.phone === phone
    );
    
    if (existingGuest && existingGuest.status !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered for this event'
      });
    }

    // Count confirmed registrations
    const confirmedMembers = (event.registeredMembers || []).filter(
      m => m.status === 'Confirmed'
    ).length;
    
    const confirmedGuests = (event.guestRegistrations || []).filter(
      g => g.status === 'Confirmed'
    ).length;
    
    const totalConfirmed = confirmedMembers + confirmedGuests;
    const status = totalConfirmed >= event.capacity ? 'Waitlisted' : 'Confirmed';

    // Add guest registration
    event.guestRegistrations.push({
      name,
      email: email || '',
      phone,
      status,
      registrationDate: now
    });

    // Increment spots booked
    event.spotsBooked = (event.spotsBooked || 0) + 1;

    await event.save();

    res.json({
      success: true,
      data: {
        status,
        message: status === 'Confirmed'
          ? 'You are now registered for this event! Check your email for confirmation.'
          : 'You have been added to the waitlist. We will notify you if a spot opens up.'
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
    
    // Decrement spots booked
    event.spotsBooked = Math.max(0, (event.spotsBooked || 0) - 1);
    
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
      // Get IDs of both Admin and Leader users
    const authorizedUserIds = await User.find({
      role: { $in: ['Admin', 'Leader'] }
    }).select('_id');

    const events = await Event.find({
      date: { $gte: today },
      createdBy: { $in: authorizedUserIds }
    })
      .sort({ date: 1 })
      .populate('createdBy', 'name role')  // Include creator's name and role
      .select('-registeredMembers -__v');
    
    // Ensure spotsBooked is always present
    const eventsWithSpotsBooked = events.map(event => {
      const eventObj = event.toObject();
      eventObj.spotsBooked = eventObj.spotsBooked || 0;
      return eventObj;
    });
    
    res.json({
      success: true,
      count: eventsWithSpotsBooked.length,
      data: eventsWithSpotsBooked,
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
    
    // Check if the event is at capacity
    const confirmedMembers = event.registeredMembers.filter(m => m.status === 'Confirmed').length;
    const confirmedGuests = event.guestRegistrations.filter(g => g.status === 'Confirmed').length;
    const totalConfirmed = confirmedMembers + confirmedGuests;
    
    // Register the guest with appropriate status
    const guestStatus = totalConfirmed >= event.capacity ? 'Waitlisted' : 'Confirmed';
    
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

// @desc    Toggle check-in for an event
// @route   POST /api/events/:id/check-in
// @access  Private (Members)
exports.toggleCheckIn = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is on the current day
    const today = new Date();
    const eventDate = new Date(event.date);
    const isEventDay = 
      today.getFullYear() === eventDate.getFullYear() &&
      today.getMonth() === eventDate.getMonth() &&
      today.getDate() === eventDate.getDate();

    if (!isEventDay) {
      return res.status(400).json({
        success: false,
        message: 'Check-in is only available on the day of the event'
      });
    }

    // Check if current time is within event hours
    const now = new Date();
    if (now < event.startTime || now > event.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Check-in is only available during event hours'
      });
    }

    // Find existing attendance record
    let attendanceRecord = event.attendance.find(
      record => record.user.toString() === req.user._id.toString()
    );

    if (attendanceRecord) {
      // Toggle existing record
      attendanceRecord.checkedIn = !attendanceRecord.checkedIn;
      if (attendanceRecord.checkedIn) {
        attendanceRecord.checkedInAt = new Date();
      }
    } else {
      // Create new attendance record
      event.attendance.push({
        user: req.user._id,
        checkedIn: true,
        checkedInAt: new Date()
      });
    }

    await event.save();

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Toggle check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance',
      error: error.message
    });
  }
};

// @desc    Get event attendance
// @route   GET /api/events/:id/attendance
// @access  Private (Admin, Leader)
exports.getEventAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('attendance.user', 'name email role');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event.attendance
    });
  } catch (error) {
    console.error('Get event attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance',
      error: error.message
    });
  }
};

// @desc    Export event attendance as CSV
// @route   GET /api/events/:id/attendance/export
// @access  Private (Admin, Leader)
exports.exportAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('attendance.user', 'name email role');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Create CSV content
    const csvHeader = 'Name,Email,Role,Check-in Status,Check-in Time\n';
    const csvRows = event.attendance.map(record => {
      const checkInTime = record.checkedInAt 
        ? new Date(record.checkedInAt).toLocaleString()
        : 'N/A';
      return `${record.user.name},${record.user.email},${record.user.role},${record.checkedIn ? 'Yes' : 'No'},${checkInTime}`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${event._id}.csv`);

    // Send CSV content
    res.send(csvContent);

  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export attendance',
      error: error.message
    });
  }
};

// @desc    Register a member for an event
// @route   POST /api/events/:id/register
// @access  Private (Members)
exports.registerMember = async (req, res) => {
  try {
    console.log('Member registration attempt:', {
      eventId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role
    });

    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check registration access control
    const userRole = req.user.role;
    const accessControl = event.registrationAccessControl;
    
    if (accessControl === 'Members' && userRole !== 'Member') {
      return res.status(403).json({
        success: false,
        message: 'This event is only open to Members'
      });
    }
    
    if (accessControl === 'Leaders' && userRole !== 'Leader') {
      return res.status(403).json({
        success: false,
        message: 'This event is only open to Leaders'
      });
    }
    
    // 'Public' and 'All' allow anyone who is authenticated

    // Check if registration period is valid
    const now = new Date();
    const regStartDate = new Date(event.registrationStartDate);
    const regEndDate = new Date(event.registrationEndDate);

    if (now < regStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Registration period has not started yet'
      });
    }

    if (now > regEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Registration period has ended'
      });
    }

    // Check if user is already registered
    const existingRegistration = event.registeredMembers.find(
      registration => registration.memberId.toString() === req.user._id.toString()
    );

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check if event is specific to regions/campuses
    if (event.regions.length > 0 && !event.regions.includes(req.user.region)) {
      return res.status(403).json({
        success: false,
        message: 'This event is not available for your region'
      });
    }

    if (event.campuses.length > 0 && !event.campuses.includes(req.user.campus)) {
      return res.status(403).json({
        success: false,
        message: 'This event is not available for your campus'
      });
    }

    // Determine registration status based on capacity
    const confirmedCount = event.registeredMembers.filter(m => m.status === 'Confirmed').length;
    const registrationStatus = confirmedCount < event.capacity ? 'Confirmed' : 'Waitlisted';

    // Add member to registrations
    event.registeredMembers.push({
      memberId: req.user._id,
      status: registrationStatus,
      registrationDate: now
    });

    // Increment spots booked
    event.spotsBooked = (event.spotsBooked || 0) + 1;

    await event.save();
    
    console.log('Registration successful:', {
      eventId: event._id,
      userId: req.user._id,
      status: registrationStatus
    });

    res.json({
      success: true,
      data: {
        status: registrationStatus,
        message: registrationStatus === 'Confirmed' 
          ? 'You are successfully registered for the event!' 
          : 'You have been added to the waitlist.'
      }
    });
  } catch (error) {
    console.error('Member registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      error: error.message
    });
  }
};

// @desc    Register guest attendance for event
// @route   POST /api/events/:id/attendance
// @access  Public
exports.registerGuestAttendance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, phone, location, invitedBy } = req.body;
    const eventId = req.params.id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if phone already registered for this event
    const existingRegistration = await EventAttendance.findOne({
      event: eventId,
      phone: phone
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered for this event'
      });
    }

    // Create attendance record
    const attendance = await EventAttendance.create({
      name,
      phone,
      location,
      invitedBy: invitedBy || '',
      event: eventId,
      eventName: event.name,
      eventDate: event.date
    });

    // Increment spots booked for the event
    event.spotsBooked = (event.spotsBooked || 0) + 1;
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Attendance registered successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Guest attendance registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register attendance',
      error: error.message
    });
  }
};

// @desc    Get all attendance records for an event
// @route   GET /api/events/:id/attendance
// @access  Private (Admin, Leader)
exports.getEventAttendance = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const attendance = await EventAttendance.find({ event: eventId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Get event attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
};

// @desc    Get all attendance records (admin view)
// @route   GET /api/events/attendance/all
// @access  Private (Admin)
exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await EventAttendance.find()
      .sort({ eventDate: -1, createdAt: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
};

// @desc    Mark all attendance records as viewed by admin
// @route   PUT /api/events/attendance/mark-viewed
// @access  Private (Admin, Leader)
exports.markAttendanceAsViewed = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Find all attendance records not yet viewed by this admin
    const attendanceRecords = await EventAttendance.find({
      viewedBy: { $ne: adminId }
    });

    // Add admin to viewedBy array for each record
    await Promise.all(
      attendanceRecords.map(record => {
        if (!record.viewedBy.includes(adminId)) {
          record.viewedBy.push(adminId);
          return record.save();
        }
      })
    );

    res.json({
      success: true,
      message: 'Attendance records marked as viewed',
      data: {
        count: attendanceRecords.length
      }
    });
  } catch (error) {
    console.error('Mark attendance as viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance as viewed',
      error: error.message
    });
  }
};
