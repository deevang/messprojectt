const Feedback = require('../models/Feedback');
const Meal = require('../models/Meal');
const User = require('../models/User');

exports.createFeedback = async (req, res) => {
  try {
    const { mealId, rating, message, category, isAnonymous } = req.body;
    
    if (mealId) {
      const meal = await Meal.findById(mealId);
      if (!meal) {
        return res.status(404).json({ error: 'Meal not found' });
      }
    }
    
    const feedback = await Feedback.create({
      userId: req.user.userId,
      mealId,
      rating,
      message,
      category,
      isAnonymous
    });
    
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getFeedbacks = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, rating, sentiment } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (rating) query.rating = rating;
    if (sentiment) query.sentiment = sentiment;
    
    const feedbacks = await Feedback.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Feedback.countDocuments(query);
    
    res.json({
      feedbacks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const { rating, message, category } = req.body;
    
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    if (req.user.role !== 'admin' && feedback.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this feedback' });
    }
    
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { rating, message, category },
      { new: true }
    );
    
    res.json(updatedFeedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    if (req.user.role !== 'admin' && feedback.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this feedback' });
    }
    
    await Feedback.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFeedbacksByUser = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user.userId })
      .populate('mealId', 'mealType date')
      .sort({ createdAt: -1 });
    
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFeedbackStats = async (req, res) => {
  try {
    const totalFeedbacks = await Feedback.countDocuments();
    const positiveFeedbacks = await Feedback.countDocuments({ sentiment: 'positive' });
    const negativeFeedbacks = await Feedback.countDocuments({ sentiment: 'negative' });
    const neutralFeedbacks = await Feedback.countDocuments({ sentiment: 'neutral' });
    
    res.json({
      totalFeedbacks,
      positiveFeedbacks,
      negativeFeedbacks,
      neutralFeedbacks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.respondToFeedback = async (req, res) => {
  try {
    const { adminResponse } = req.body;
    
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { 
        adminResponse,
        status: 'reviewed'
      },
      { new: true }
    );
    
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.analyzeFeedbackSentiment = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // This is a placeholder for a real AI sentiment analysis call
    const sentiments = ['positive', 'negative', 'neutral'];
    const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

    feedback.sentiment = randomSentiment;
    await feedback.save();

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
};