const mongoose = require('mongoose');
const dns = require('dns');

require('dotenv').config();

// Set Google DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

console.log('Testing MongoDB connection...');
console.log('URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ MongoDB connection failed:', err);
    process.exit(1);
  });