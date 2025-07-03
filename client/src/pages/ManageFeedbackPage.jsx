import { useState, useEffect } from 'react';
import { feedbackAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  MessageSquare,
  Smile,
  Frown,
  Meh,
  Eye,
  Trash2,
  Brain,
  Send
} from 'lucide-react';

const ManageFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    positiveFeedbacks: 0,
    negativeFeedbacks: 0,
    neutralFeedbacks: 0
  });
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [analyzedSentiment, setAnalyzedSentiment] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, [currentPage, sentimentFilter]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        sentiment: sentimentFilter || undefined
      };
      const res = await feedbackAPI.getAll(params);
      setFeedbacks(res.data.feedbacks || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await feedbackAPI.getStats();
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAnalyzeSentiment = async (feedback) => {
    try {
      setAiLoading(true);
      setSelectedFeedback(feedback);
      setShowDetailsModal(true);
      const res = await aiAPI.analyzeSentiment(feedback.message);
      setAnalyzedSentiment(res.data);
    } catch (error) {
      toast.error('Failed to analyze sentiment');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      await feedbackAPI.respond(selectedFeedback._id, responseText);
      toast.success('Response sent successfully!');
      setShowResponseModal(false);
      setResponseText('');
      fetchFeedbacks();
    } catch (error) {
      toast.error('Failed to send response');
    }
  };
  
  const handleDelete = async (feedbackId) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await feedbackAPI.delete(feedbackId);
        toast.success('Feedback deleted successfully!');
        fetchFeedbacks();
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete feedback');
      }
    }
  };


  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setAnalyzedSentiment(null);
    setShowDetailsModal(true);
  };
  
  const handleRespondClick = (feedback) => {
    setSelectedFeedback(feedback);
    setShowResponseModal(true);
  };

  const getSentimentBadge = (sentiment) => {
    const config = {
      positive: { 
        color: 'bg-green-100 text-green-800', 
        icon: <Smile className="w-4 h-4" />,
        label: 'Positive'
      },
      negative: { 
        color: 'bg-red-100 text-red-800', 
        icon: <Frown className="w-4 h-4" />,
        label: 'Negative'
      },
      neutral: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: <Meh className="w-4 h-4" />,
        label: 'Neutral'
      }
    };
    
    const badgeConfig = config[sentiment] || config.neutral;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeConfig.color}`}>
        {badgeConfig.icon}
        <span className="ml-1">{badgeConfig.label}</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-background dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Manage Feedback</h1>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8 transition-colors duration-300">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search feedback..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-background dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-background dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
            <button
              onClick={() => {
                setSentimentFilter('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">No feedback found</td>
                </tr>
              ) : (
                feedbacks.map((feedback) => (
                  <tr key={feedback._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{feedback.userId?.name || 'Anonymous'}</div>
                        <div className="text-sm text-gray-500">{feedback.userId?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {feedback.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSentimentBadge(feedback.sentiment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onClick={() => handleViewDetails(feedback)} className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleAnalyzeSentiment(feedback)} className="text-purple-600 hover:text-purple-900">
                        <Brain className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleRespondClick(feedback)} className="text-green-600 hover:text-green-900">
                        <MessageSquare className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(feedback._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
       {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Respond to Feedback</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Original Feedback:</label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                    {selectedFeedback.message}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Your Response:</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your response..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponseText('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRespond}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Details</h3>
              <div className="space-y-3">
                <p><span className="font-semibold">Student:</span> {selectedFeedback.userId?.name || 'Anonymous'}</p>
                <p><span className="font-semibold">Email:</span> {selectedFeedback.userId?.email || 'N/A'}</p>
                <p><span className="font-semibold">Feedback:</span></p>
                <p className="bg-gray-50 p-2 rounded">{selectedFeedback.message}</p>
                {aiLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : analyzedSentiment ? (
                  <div>
                    <h4 className="font-semibold mt-4">AI Sentiment Analysis</h4>
                    <p>Sentiment: {getSentimentBadge(analyzedSentiment.sentiment)}</p>
                    <p>Confidence: {Math.round(analyzedSentiment.confidence * 100)}%</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <button onClick={() => handleAnalyzeSentiment(selectedFeedback)} className="btn-primary w-full">
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze Sentiment
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
};

export default ManageFeedbackPage; 