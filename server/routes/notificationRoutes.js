const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get admin notifications (for head staff approval requests)
router.get('/admin', verifyToken, async (req, res) => {
  try {
    // Only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const notifications = await Notification.find({
      type: 'head_staff_request',
      isRead: false
    }).populate('sender', 'name email');

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve head staff request
router.post('/:notificationId/approve', verifyToken, async (req, res) => {
  try {
    // Only admins can approve requests
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const notification = await Notification.findById(req.params.notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.type !== 'head_staff_request') {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    // Update user role to staff_head
    await User.findByIdAndUpdate(notification.sender, { role: 'staff_head' });

    // Mark notification as read
    notification.isRead = true;
    notification.actionTaken = 'approved';
    notification.actionTakenBy = req.user._id;
    notification.actionTakenAt = new Date();
    await notification.save();

    res.json({ message: 'Head staff request approved successfully' });
  } catch (error) {
    console.error('Error approving head staff request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reject head staff request
router.post('/:notificationId/reject', verifyToken, async (req, res) => {
  try {
    // Only admins can reject requests
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const notification = await Notification.findById(req.params.notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.type !== 'head_staff_request') {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    // Update user role back to pending
    await User.findByIdAndUpdate(notification.sender, { role: 'pending' });

    // Mark notification as read
    notification.isRead = true;
    notification.actionTaken = 'rejected';
    notification.actionTakenBy = req.user._id;
    notification.actionTakenAt = new Date();
    await notification.save();

    res.json({ message: 'Head staff request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting head staff request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark notifications as read
router.post('/mark-read', verifyToken, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: 'Invalid notification IDs' });
    }

    await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { isRead: true }
    );

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 