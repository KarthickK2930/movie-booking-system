const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas!');
    process.exit();
  })
  .catch(err => {
    console.log('❌ Connection failed:', err.message);
    process.exit();
  });