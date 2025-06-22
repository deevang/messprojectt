const getCalorieEstimation = async (req, res) => {
  const { mealName } = req.body;

  if (!mealName) {
    return res.status(400).json({ error: 'Meal name is required' });
  }

  try {
    // In a real application, you would call an external AI API here.
    // For this example, we'll simulate an AI response.
    const estimatedCalories = Math.floor(Math.random() * (800 - 300 + 1)) + 300; // Random calories between 300 and 800

    res.json({ calories: estimatedCalories });
  } catch (error) {
    console.error('Error getting calorie estimation:', error);
    res.status(500).json({ error: 'Failed to estimate calories' });
  }
};

const analyzeSentiment = async (req, res) => {
  const { feedbackText } = req.body;

  if (!feedbackText) {
    return res.status(400).json({ error: 'Feedback text is required' });
  }

  try {
    // In a real application, you would call an external AI API here.
    // For this example, we'll simulate sentiment analysis based on keywords.
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'delicious', 'love', 'perfect', 'wonderful', 'fantastic', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'disgusting', 'hate', 'worst', 'poor', 'disappointing', 'horrible', 'unacceptable'];
    
    const text = feedbackText.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
    
    let sentiment = 'neutral';
    let confidence = 0.5;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = Math.min(0.9, 0.5 + (positiveCount - negativeCount) * 0.1);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = Math.min(0.9, 0.5 + (negativeCount - positiveCount) * 0.1);
    }
    
    // Add some randomness for more realistic results
    confidence += (Math.random() - 0.5) * 0.2;
    confidence = Math.max(0.1, Math.min(0.95, confidence));

    res.json({ 
      sentiment, 
      confidence: Math.round(confidence * 100) / 100,
      positiveScore: positiveCount,
      negativeScore: negativeCount
    });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
};

module.exports = {
  getCalorieEstimation,
  analyzeSentiment,
}; 