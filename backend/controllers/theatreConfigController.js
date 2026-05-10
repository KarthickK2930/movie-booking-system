const TheatreConfig = require('../models/TheatreConfig');

// Get theatre config
const getTheatreConfig = async (req, res) => {
  try {
    let config = await TheatreConfig.findOne();
    if (!config) {
      config = await TheatreConfig.create({});
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update theatre config (set weekday/weekend shows once)
const updateTheatreConfig = async (req, res) => {
  try {
    let config = await TheatreConfig.findOne();
    if (config) {
      config = await TheatreConfig.findByIdAndUpdate(config._id, req.body, { new: true });
    } else {
      config = await TheatreConfig.create(req.body);
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTheatreConfig, updateTheatreConfig };