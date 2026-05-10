const Screen = require('../models/Screen');

// Get screen
const getScreen = async (req, res) => {
  try {
    let screen = await Screen.findOne();
    if (!screen) {
      screen = await Screen.create({ name: 'Main Screen', totalSeats: 50, pricePerSeat: 150 });
    }
    res.json(screen);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update screen
const updateScreen = async (req, res) => {
  try {
    let screen = await Screen.findOne();
    if (screen) {
      screen = await Screen.findByIdAndUpdate(screen._id, req.body, { new: true });
    } else {
      screen = await Screen.create(req.body);
    }
    res.json(screen);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getScreen, updateScreen };