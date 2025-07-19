import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { feedbackAPI } from '../services/api';
import { 
  MessageSquare, 
  AlertCircle, 
  Plus, 
  Star,
  Calendar,
  Send,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentFeedbackPage = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'feedback',
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    rating: 5,
    isAnonymous: false,
    attachments: []
  });

  useEffect(() => {
    fetchUserFeedbacks();
  }, []);

  const fetchUserFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await feedbackAPI.getByUser();
      setFeedbacks(res.data || []);
    } catch (error) {
      toast.error('Failed to fetch feedbacks');
      console.error('Fetch feedbacks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...files.map(f => f.name)]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await feedbackAPI.create(formData);
      toast.success(formData.type === 'complaint' ? 'Complaint submitted successfully!' : 'Feedback submitted successfully!');
      setFormData({
        type: 'feedback',
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        rating: 5,
        isAnonymous: false,
        attachments: []
      });
      setShowForm(false);
      fetchUserFeedbacks();
    } catch (error) {
      toast.error('Failed to submit. Please try again.');
      console.error('Feedback submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const markAsRead = async (feedbackId) => {
    try {
      await feedbackAPI.markAsReadStudent(feedbackId);
      setFeedbacks(prev => prev.map(f => 
        f._id === feedbackId ? { ...f, isReadByStudent: true } : f
      ));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'pending':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-background dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Feedback & Complaints
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Submit new feedback or complaints and track their status
        </p>
      </div>

      {/* Action Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Cancel' : 'Submit New Feedback'}</span>
        </button>
      </div>

      {/* Feedback Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Submit New Feedback</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="feedback"
                    checked={formData.type === 'feedback'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Feedback</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="complaint"
                    checked={formData.type === 'complaint'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Complaint</span>
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={formData.type === 'complaint' ? 'Brief description of the issue' : 'What would you like to share?'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder={formData.type === 'complaint' ? 'Please provide detailed information about the issue...' : 'Share your thoughts and suggestions...'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">General</option>
                <option value="food_quality">Food Quality</option>
                <option value="food_taste">Food Taste</option>
                <option value="service">Service</option>
                <option value="cleanliness">Cleanliness</option>
                <option value="pricing">Pricing</option>
                <option value="staff_behavior">Staff Behavior</option>
                <option value="facility">Facility</option>
              </select>
            </div>

            {/* Priority (for complaints) */}
            {formData.type === 'complaint' && (
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            )}

            {/* Rating (for feedback) */}
            {formData.type === 'feedback' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className={`p-1 rounded ${
                        star <= formData.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {formData.rating}/5
                  </span>
                </div>
              </div>
            )}

            {/* Anonymous Option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAnonymous"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="isAnonymous" className="text-sm text-gray-700 dark:text-gray-200">
                Submit anonymously
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit {formData.type === 'complaint' ? 'Complaint' : 'Feedback'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feedbacks List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Feedback History</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Loading feedbacks...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">No feedback submitted yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {feedbacks.map((feedback) => (
              <div 
                key={feedback._id} 
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  feedback.adminResponse && !feedback.isReadByStudent ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-3">
                      {feedback.type === 'complaint' ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {feedback.title}
                      </h3>
                      {feedback.adminResponse && !feedback.isReadByStudent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          New Response
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {feedback.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                        {feedback.priority}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                        {feedback.status.replace('_', ' ')}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {feedback.category.replace('_', ' ')}
                      </span>
                      {feedback.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {feedback.rating}/5
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Submitted on {formatDate(feedback.createdAt)}</span>
                    </div>

                    {feedback.adminResponse && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Admin Response:</p>
                          {!feedback.isReadByStudent && (
                            <button
                              onClick={() => markAsRead(feedback._id)}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Mark as read
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{feedback.adminResponse}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeedbackPage; 