require('dotenv').config();

const express = require('express');
const cors = require('cors');
const queueRoutes = require('./routes/queueRoutes');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const stylistRoutes = require('./routes/stylistRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// API Base Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Gloss & Cut API running perfectly.'
  });
});

// Register Routes
app.use('/api/queues', queueRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/stylists', stylistRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: err.message
  });
});

module.exports = app;