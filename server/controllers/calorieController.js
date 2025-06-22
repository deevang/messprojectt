const CalorieLog = require('../models/CalorieLog');

exports.logCalories = async (req, res) => {
  try {
    const log = await CalorieLog.create(req.body);
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getCaloriesByUser = async (req, res) => {
  try {
    const logs = await CalorieLog.find({ userId: req.user.userId });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
