// Vercel Serverless Entry Point
// This file wraps the Express app for Vercel deployment
// Note: Socket.io is not supported in Vercel serverless, 
// so real-time queue updates will not work in this deployment.
const app = require('../src/app');
module.exports = app;
