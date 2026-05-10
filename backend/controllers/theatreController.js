const Theatre = require('../models/Theatre');

const getTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findOne();
    res.json(theatre || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTheatre = async (req, res) => {
  try {
    let theatre = await Theatre.findOne();
    if (theatre) {
      theatre = await Theatre.findByIdAndUpdate(theatre._id, req.body, { new: true });
    } else {
      theatre = await Theatre.create(req.body);
    }
    res.json(theatre);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTheatre, updateTheatre };