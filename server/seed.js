const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');


// Import User model
const User = require('./models/User');

// Create dummy data
const createDummyData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    console.log('Cleared existing user data');

    // Hash a password for all users
    const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash('password123', salt);

    // Create an admin
    const admin = await User.create({
        name: 'Admin User',
        email: 'admin@trailblazer.com',
        password: 'password123', // Let the pre-save hook hash it
        role: 'Admin',
        registrationStatus: 'Completed'
      });
    console.log('Admin user created');

    // Create leaders for different regions
    const regions = ['East Coast', 'West Coast', 'Midwest', 'South'];
    const campuses = {
      'East Coast': ['New York University', 'Boston College', 'University of Pennsylvania'],
      'West Coast': ['Stanford University', 'UCLA', 'UC Berkeley'],
      'Midwest': ['University of Michigan', 'Ohio State University', 'University of Wisconsin'],
      'South': ['University of Texas', 'Florida State University', 'Vanderbilt University']
    };

    const leaders = [];

    for (const region of regions) {
      for (const campus of campuses[region]) {
        const leader = await User.create({
          name: `Leader ${campus}`,
          email: `leader.${campus.toLowerCase().replace(/\s+/g, '.')}@trailblazer.com`,
          password: 'password123', // Let the pre-save hook hash it
          role: 'Leader',
          region: region,
          campus: campus,
          registrationStatus: 'Completed'
        });
        
        leaders.push(leader);
        console.log(`Leader created for ${campus}`);
      }
    }

    // Create members for each leader
    const memberNames = [
      'John Smith', 'Jane Doe', 'Robert Johnson', 'Emily Davis', 
      'Michael Wilson', 'Sarah Brown', 'David Miller', 'Jessica Garcia',
      'Thomas Rodriguez', 'Jennifer Martinez', 'Christopher Lee', 'Amanda White'
    ];

    for (const leader of leaders) {
      // Create 3-5 members per leader
      const memberCount = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < memberCount; i++) {
        const randomNameIndex = Math.floor(Math.random() * memberNames.length);
        const memberName = memberNames[randomNameIndex];
        const emailPrefix = memberName.toLowerCase().replace(/\s+/g, '.');
        
        await User.create({
          name: memberName,
          email: `${emailPrefix}.${Math.floor(Math.random() * 1000)}@student.edu`,
          password: 'password123', // Let the pre-save hook hash it
          role: 'Member',
          region: leader.region,
          campus: leader.campus,
          leaderId: leader._id,
          registrationStatus: Math.random() > 0.3 ? 'Completed' : 'Pending'
          // memberCode will be auto-generated in the pre-save hook
        });
      }
      
      console.log(`Created ${memberCount} members for ${leader.campus}`);
    }

    console.log('All dummy data created successfully!');
  } catch (error) {
    console.error(`Error creating dummy data: ${error.message}`);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
const runSeed = async () => {
  await connectDB();
  await createDummyData();
  process.exit(0);
};

runSeed();