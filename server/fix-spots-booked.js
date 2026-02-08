const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('./models/Events');
const EventAttendance = require('./models/EventAttendance');

async function fixSpotsBooked() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const events = await Event.find({});
    console.log(`Found ${events.length} events to update`);

    for (const event of events) {
      // Count actual registrations
      const attendanceCount = await EventAttendance.countDocuments({ 
        event: event._id,
        status: { $ne: 'Cancelled' }
      });
      
      const memberCount = event.registeredMembers?.filter(
        m => m.status === 'Confirmed'
      ).length || 0;
      
      const guestCount = event.guestRegistrations?.filter(
        g => g.status === 'Confirmed'
      ).length || 0;
      
      // Total spots booked
      const totalBooked = attendanceCount + memberCount + guestCount;
      
      // Update the event
      await Event.findByIdAndUpdate(event._id, {
        spotsBooked: totalBooked
      });
      
      console.log(`Updated "${event.name}": spotsBooked = ${totalBooked} (Attendance: ${attendanceCount}, Members: ${memberCount}, Guests: ${guestCount})`);
    }

    console.log('\nAll events updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixSpotsBooked();
