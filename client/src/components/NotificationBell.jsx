import { useState, useEffect } from 'react';
import { Bell, MessageSquare, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { feedbackAPI } from '../services/api';
import toast from 'react-hot-toast';

const NotificationBell = ({ user }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check if user can see notifications (all users can see notifications)
  const canViewNotifications = user?.role === 'admin' || user?.role === 'staff_head' || user?.role === 'student';

  useEffect(() => {
    if (canViewNotifications) {
      fetchUnreadCount();
      fetchRecentFeedbacks();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [canViewNotifications]);

  const fetchUnreadCount = async () => {
    try {
      let endpoint;
      if (user?.role === 'admin') {
        endpoint = feedbackAPI.getUnreadCountAdmin;
      } else if (user?.role === 'staff_head') {
        endpoint = feedbackAPI.getUnreadCountStaff;
      } else if (user?.role === 'student') {
        endpoint = feedbackAPI.getUnreadCountStudent;
      }
      
      if (endpoint) {
        const res = await endpoint();
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchRecentFeedbacks = async () => {
    setLoading(true);
    try {
      let endpoint;
      let params = { limit: 10 };
      
      if (user?.role === 'admin') {
        endpoint = feedbackAPI.getAll;
        params.isReadByAdmin = false;
      } else if (user?.role === 'staff_head') {
        endpoint = feedbackAPI.getAllStaff;
        params.isReadByStaff = false;
      } else if (user?.role === 'student') {
        // For students, show feedbacks with admin responses
        endpoint = feedbackAPI.getByUser;
        params = {};
      }
      
      if (endpoint) {
        const res = await endpoint(params);
        if (user?.role === 'student') {
          // Filter to show only feedbacks with admin responses
          const feedbacksWithResponses = (res.data || []).filter(f => f.adminResponse);
          setFeedbacks(feedbacksWithResponses);
        } else {
          setFeedbacks(res.data.feedbacks || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (feedbackId) => {
    try {
      let endpoint;
      if (user?.role === 'admin') {
        endpoint = feedbackAPI.markAsReadAdmin;
      } else if (user?.role === 'staff_head') {
        endpoint = feedbackAPI.markAsReadStaff;
      } else if (user?.role === 'student') {
        endpoint = feedbackAPI.markAsReadStudent;
      }
      
      if (endpoint) {
        await endpoint(feedbackId);
        setFeedbacks(prev => prev.filter(f => f._id !== feedbackId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const feedbackIds = feedbacks.map(f => f._id);
      let endpoint;
      
      if (user?.role === 'admin') {
        endpoint = feedbackAPI.markMultipleAsReadAdmin;
      } else if (user?.role === 'staff_head') {
        endpoint = feedbackAPI.markMultipleAsReadStaff;
      } else if (user?.role === 'student') {
        // For students, mark each feedback as read individually
        for (const feedbackId of feedbackIds) {
          await feedbackAPI.markAsReadStudent(feedbackId);
        }
        setFeedbacks([]);
        setUnreadCount(0);
        toast.success('All notifications marked as read');
        return;
      }
      
      if (endpoint) {
        await endpoint(feedbackIds);
        setFeedbacks([]);
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
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

  const getTypeIcon = (type) => {
    return type === 'complaint' ? (
      <AlertCircle className="w-4 h-4 text-red-500" />
    ) : (
      <MessageSquare className="w-4 h-4 text-blue-500" />
    );
  };



  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="p-4 text-center">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {feedbacks.map((feedback) => (
                    <div key={feedback._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            {getTypeIcon(feedback.type)}
                            {getStatusIcon(feedback.status)}
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {feedback.title}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                            {feedback.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                                {feedback.priority}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {feedback.category.replace('_', ' ')}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {feedback.timeAgo}
                              </span>
                              <button
                                onClick={() => markAsRead(feedback._id)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          {feedback.userId && !feedback.isAnonymous && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              By: {feedback.userId.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {feedbacks.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to feedback management page based on role
                    if (user?.role === 'student') {
                      window.location.href = '/student-feedback';
                    } else {
                      window.location.href = '/manage-feedback';
                    }
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View all feedback
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell; 