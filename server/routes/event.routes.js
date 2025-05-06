const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { handleEventImageUpload } = require('../middleware/event.middleware');



// @desc    Get public events (no authentication required)
// @route   GET /api/public/events
// @access  Public
router.get(
  '/public/events', 
  eventController.getPublicEvents
);

// @desc    Guest registration
// @route   POST /api/events/:id/guest-register
// @access  Public
router.post(
  '/:id/guest-register',
  eventController.registerGuest
);


// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Admin, Leader)
router.post(
  '/',
  protect,
  authorize('Admin', 'Leader'),
  handleEventImageUpload,
  [
    check('name', 'Event name is required').not().isEmpty(),
    check('description', 'Event description is required').not().isEmpty(),
    check('date', 'Valid event date is required').isISO8601(),
    check('location', 'Event location is required').not().isEmpty(),
    check('capacity', 'Event capacity is required').isInt({ min: 1 })
  ],
  eventController.createEvent
);

// @desc    Get all events
// @route   GET /api/events
// @access  Private (All roles)
router.get(
  '/',
  protect,
  eventController.getEvents
);

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Private (All roles, with restrictions)
router.get(
  '/:id',
  protect,
  eventController.getEventById
);

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin, Leader who created the event)
router.put(
  '/:id',
  protect,
  authorize('Admin', 'Leader'),
  handleEventImageUpload,
  [
    check('name', 'Event name is required').not().isEmpty(),
    check('description', 'Event description is required').not().isEmpty(),
    check('date', 'Valid event date is required').isISO8601(),
    check('location', 'Event location is required').not().isEmpty(),
    check('capacity', 'Event capacity is required').isInt({ min: 1 })
  ],
  eventController.updateEvent
);

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin, Leader who created the event)
router.delete(
  '/:id',
  protect,
  authorize('Admin', 'Leader'),
  eventController.deleteEvent
);

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private (Members only)
router.post(
  '/:id/register',
  protect,
  authorize('Member'),
  eventController.registerForEvent
);

// @desc    Cancel registration for an event
// @route   PUT /api/events/:id/cancel
// @access  Private (Members only)
router.put(
  '/:id/cancel',
  protect,
  authorize('Member'),
  eventController.cancelRegistration
);

module.exports = router;