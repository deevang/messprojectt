const Feedback = require('../models/Feedback');
const Meal = require('../models/Meal');
const User = require('../models/User');

// Create feedback or complaint
exports.createFeedback = async (req, res) => {
  try {
    const { 
      mealId, 
      type, 
      rating, 
      title, 
      description, 
      category, 
      priority, 
      isAnonymous,
      attachments,
      tags 
    } = req.body;
    
    // Only validate mealId if it's provided
    if (mealId && mealId.trim() !== '') {
      const meal = await Meal.findById(mealId);
      if (!meal) {
        return res.status(404).json({ error: 'Meal not found' });
      }
    }
    
    const feedback = await Feedback.create({
      userId: req.user.userId,
      mealId: mealId && mealId.trim() !== '' ? mealId : undefined,
      type,
      rating,
      title,
      description,
      category,
      priority,
      isAnonymous,
      attachments: attachments || [],
      tags: tags || []
    });
    
    // Populate user info for response
    await feedback.populate('userId', 'name email');
    
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all feedbacks/complaints (for admin/staff)
exports.getFeedbacks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      status, 
      type, 
      priority,
      assignedTo,
      isReadByAdmin,
      isReadByStaff
    } = req.query;
    
    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (isReadByAdmin !== undefined) query.isReadByAdmin = isReadByAdmin === 'true';
    if (isReadByStaff !== undefined) query.isReadByStaff = isReadByStaff === 'true';
    
    const feedbacks = await Feedback.find(query)
      .populate('userId', 'name email')
      .populate('resolvedBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Feedback.countDocuments(query);
    
    res.json({
      feedbacks,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get feedbacks by user (for students)
exports.getFeedbacksByUser = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user.userId })
      .populate('resolvedBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update feedback (for users to edit their own)
exports.updateFeedback = async (req, res) => {
  try {
    const { title, description, category, priority, rating } = req.body;
    
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'staff_head' && feedback.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this feedback' });
    }
    
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { title, description, category, priority, rating },
      { new: true }
    ).populate('userId', 'name email');
    
    res.json(updatedFeedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'staff_head' && feedback.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this feedback' });
    }
    
    await Feedback.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin/Staff response to feedback
exports.respondToFeedback = async (req, res) => {
  try {
    const { adminResponse, status, assignedTo } = req.body;
    
    const updateData = { adminResponse };
    
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    
    // If status is resolved, add resolvedBy and resolvedAt
    if (status === 'resolved') {
      updateData.resolvedBy = req.user.userId;
      updateData.resolvedAt = new Date();
    }
    
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('userId', 'name email')
     .populate('resolvedBy', 'name')
     .populate('assignedTo', 'name');
    
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Mark feedback as read by admin
exports.markAsReadByAdmin = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isReadByAdmin: true },
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

// Mark feedback as read by staff
exports.markAsReadByStaff = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isReadByStaff: true },
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

// Mark multiple feedbacks as read by admin
exports.markMultipleAsReadByAdmin = async (req, res) => {
  try {
    const { feedbackIds } = req.body;
    
    await Feedback.updateMany(
      { _id: { $in: feedbackIds } },
      { isReadByAdmin: true }
    );
    
    res.json({ message: 'Feedbacks marked as read by admin' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Mark multiple feedbacks as read by staff
exports.markMultipleAsReadByStaff = async (req, res) => {
  try {
    const { feedbackIds } = req.body;
    
    await Feedback.updateMany(
      { _id: { $in: feedbackIds } },
      { isReadByStaff: true }
    );
    
    res.json({ message: 'Feedbacks marked as read by staff' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get feedback statistics
exports.getFeedbackStats = async (req, res) => {
  try {
    const totalFeedbacks = await Feedback.countDocuments();
    const totalComplaints = await Feedback.countDocuments({ type: 'complaint' });
    const totalReviews = await Feedback.countDocuments({ type: 'feedback' });
    const pendingFeedbacks = await Feedback.countDocuments({ status: 'pending' });
    const inProgressFeedbacks = await Feedback.countDocuments({ status: 'in_progress' });
    const resolvedFeedbacks = await Feedback.countDocuments({ status: 'resolved' });
    const urgentFeedbacks = await Feedback.countDocuments({ priority: 'urgent' });
    const unreadFeedbacks = await Feedback.countDocuments({ isRead: false });
    
    // Category breakdown
    const categoryStats = await Feedback.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Priority breakdown
    const priorityStats = await Feedback.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalFeedbacks,
      totalComplaints,
      totalReviews,
      pendingFeedbacks,
      inProgressFeedbacks,
      resolvedFeedbacks,
      urgentFeedbacks,
      unreadFeedbacks,
      categoryStats,
      priorityStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get unread feedback count for admin (for notifications)
exports.getUnreadCountForAdmin = async (req, res) => {
  try {
    const count = await Feedback.countDocuments({ isReadByAdmin: false });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get unread feedback count for staff (for notifications)
exports.getUnreadCountForStaff = async (req, res) => {
  try {
    const count = await Feedback.countDocuments({ isReadByStaff: false });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark feedback as read by student
exports.markAsReadByStudent = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isReadByStudent: true },
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

// Get unread feedback count for students (for notifications)
exports.getUnreadCountForStudent = async (req, res) => {
  try {
    // Count feedbacks that have admin responses but student hasn't seen them
    const count = await Feedback.countDocuments({ 
      userId: req.user.userId,
      adminResponse: { $exists: true, $ne: null, $ne: '' },
      isReadByStudent: false 
    });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};