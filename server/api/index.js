const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('../config/db');

// Import routes
const authRoutes = require('../routes/auth.routes');
const userRoutes = require('../routes/user.routes');
const eventRoutes = require('../routes/event.routes');
const messageRoutes = require('../routes/message.routes');
const paymentRoutes = require('../routes/payment.routes');
const galleryRoutes = require('../routes/gallery.routes');


// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/gallery', galleryRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Trailblazer dashboard' });
});

// app.get('/debug-uploads', (req, res) => {
//   const uploadsPath = path.join(__dirname, 'uploads/events');
//   fs.readdir(uploadsPath, (err, files) => {
//     if (err) {
//       return res.status(500).send(`Error reading directory: ${err.message}`);
//     }
//     res.json({ files });
//   });
// });
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

module.exports = app;