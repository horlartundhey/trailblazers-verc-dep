const mongoose = require('mongoose');
const Event = require('./models/Events');
require('dotenv').config();

async function initializeSpotsBooked() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all events
    const events = await Event.find({});
    console.log(`Found ${events.length} events`);

    let updatedCount = 0;
    
    for (const event of events) {
      // If spotsBooked is undefined or null, calculate it from existing registrations
      if (event.spotsBooked === undefined || event.spotsBooked === null) {
        // Count confirmed members
        const confirmedMembers = (event.registeredMembers || []).filter(
          m => m.status === 'Confirmed'
        ).length;
        
        // Count confirmed guests
        const confirmedGuests = (event.guestRegistrations || []).filter(
          g => g.status === 'Confirmed'
        ).length;
        
        // Count attendance registrations (from EventAttendance collection)
        const EventAttendance = require('./models/EventAttendance');
        const attendanceCount = await EventAttendance.countDocuments({
          event: event._id,
          status: 'Registered'
        });
        
        const totalBooked = confirmedMembers + confirmedGuests + attendanceCount;
        
        event.spotsBooked = totalBooked;
        await event.save();
        
        console.log(`Updated ${event.name}: ${totalBooked} spots booked`);
        updatedCount++;
      }
    }

    console.log(`\nInitialization complete: ${updatedCount} events updated`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initializeSpotsBooked();
