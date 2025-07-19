const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: false },
  type: { type: String, enum: ['feedback', 'complaint'], required: true },
  rating: { type: Number, min: 1, max: 5 }, // Optional for complaints
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['food_quality', 'food_taste', 'service', 'cleanliness', 'pricing', 'staff_behavior', 'facility', 'general'], 
    default: 'general' 
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  isAnonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved', 'closed'], default: 'pending' },
  adminResponse: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  attachments: [{ type: String }], // URLs to uploaded files/images
  tags: [{ type: String }], // For better categorization
  isReadByAdmin: { type: Boolean, default: false }, // For admin notification purposes
  isReadByStaff: { type: Boolean, default: false }, // For staff notification purposes
  isReadByStudent: { type: Boolean, default: false }, // For student notification purposes
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Assign to specific staff member
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time since creation
feedbackSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInMs = now - this.createdAt;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  return 'Just now';
});

module.exports = mongoose.model('Feedback', feedbackSchema); 