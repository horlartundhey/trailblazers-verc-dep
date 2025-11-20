require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Events');

const fixEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Just fix the December Leadership Training event directly
    const event = await Event.findOne({ name: /December/i });
    
    if (event) {
      console.log('Before:');
      console.log('  Regions:', event.regions);
      console.log('  Campuses:', event.campuses);
      
      // Set clean values
      event.regions = ['Lagos'];
      event.campuses = ['Yaba Campus'];
      
      await event.save();
      
      console.log('\nAfter:');
      console.log('  Regions:', event.regions);
      console.log('  Campuses:', event.campuses);
      console.log('\nFixed!');
    } else {
      console.log('Event not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixEvents();
