import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  ClockIcon,
  ArrowLeftIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { getForm, getFormResponses } from '../services/api';
import { exportResponsesToCSV } from '../utils/export';

const FormAnalytics = () => {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    loadData();
  }, [formId]);

  const loadData = async () => {
    try {
      const [formData, responsesData] = await Promise.all([
        getForm(formId),
        getFormResponses(formId)
      ]);
      setForm(formData);
      setResponses(responsesData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionExpansion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const calculateAnalytics = () => {
    if (!responses.length) return null;

    const totalResponses = responses.length;
    const avgScore = responses.reduce((sum, r) => sum + (r.score || 0), 0) / totalResponses;
    const avgTime = responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / totalResponses;
    const passRate = responses.filter(r => (r.score / r.maxScore) >= 0.6).length / totalResponses * 100;

    const scoreDistribution = {
      excellent: responses.filter(r => (r.score / r.maxScore) >= 0.9).length,
      good: responses.filter(r => (r.score / r.maxScore) >= 0.7 && (r.score / r.maxScore) < 0.9).length,
      fair: responses.filter(r => (r.score / r.maxScore) >= 0.5 && (r.score / r.maxScore) < 0.7).length,
      poor: responses.filter(r => (r.score / r.maxScore) < 0.5).length
    };

    return {
      totalResponses,
      avgScore: Math.round(avgScore * 10) / 10,
      avgTime: Math.round(avgTime),
      passRate: Math.round(passRate),
      scoreDistribution
    };
  };

  const getQuestionAnalytics = (question) => {
    const questionAnswers = responses.map(r => r.answers[question.id]).filter(Boolean);
    
    if (question.type === 'categorize') {
      const correctMap = question.data.correctMap;
      const itemAnalytics = {};
      
      Object.keys(correctMap).forEach(item => {
        const correctCategory = correctMap[item];
        const correctPlacements = questionAnswers.filter(answer => 
          answer && answer[item] === correctCategory
        ).length;
        
        const categoryDistribution = {};
        questionAnswers.forEach(answer => {
          if (answer && answer[item]) {
            categoryDistribution[answer[item]] = (categoryDistribution[answer[item]] || 0) + 1;
          }
        });
        
        itemAnalytics[item] = {
          correctPlacements,
          accuracy: questionAnswers.length > 0 ? Math.round((correctPlacements / questionAnswers.length) * 100) : 0,
          categoryDistribution
        };
      });
      
      return { itemAnalytics };
    }
    
    if (question.type === 'cloze') {
      const correctAnswers = question.data.answers || [];
      const blankAnalytics = correctAnswers.map((correctAnswer, index) => {
        const correctCount = questionAnswers.filter(userAnswers => 
          Array.isArray(userAnswers) && userAnswers[index] === correctAnswer
        ).length;
        
        const answerDistribution = {};
        questionAnswers.forEach(userAnswers => {
          if (Array.isArray(userAnswers) && userAnswers[index]) {
            const answer = userAnswers[index];
            answerDistribution[answer] = (answerDistribution[answer] || 0) + 1;
          }
        });
        
        return {
          correctAnswer,
          correctCount,
          accuracy: questionAnswers.length > 0 ? Math.round((correctCount / questionAnswers.length) * 100) : 0,
          answerDistribution
        };
      });
      
      return { blankAnalytics };
    }
    
    if (question.type === 'comprehension') {
      const questionAnalytics = question.data.questions.map((q, qIndex) => {
        const correctChoice = q.correct;
        
        let correctCount = 0;
        const choiceDistribution = {};
        
        questionAnswers.forEach(userAnswer => {
          let userAnswers = [];
          
          // Handle both array and object formats for backward compatibility
          if (Array.isArray(userAnswer)) {
            userAnswers = userAnswer;
          } else if (userAnswer && typeof userAnswer === 'object') {
            // Convert object format {0: 1, 1: 2} to array format [1, 2]
            userAnswers = [];
            question.data.questions.forEach((_, index) => {
              userAnswers[index] = userAnswer[index];
            });
          }
          
          // Check if this question was answered correctly
          if (typeof userAnswers[qIndex] === 'number' && userAnswers[qIndex] === correctChoice) {
            correctCount++;
          }
          
          // Update choice distribution
          if (typeof userAnswers[qIndex] === 'number') {
            const choice = userAnswers[qIndex];
            choiceDistribution[choice] = (choiceDistribution[choice] || 0) + 1;
          }
        });
        
        return {
          question: q.question,
          correctChoice,
          correctCount,
          accuracy: questionAnswers.length > 0 ? Math.round((correctCount / questionAnswers.length) * 100) : 0,
          choiceDistribution
        };
      });
      
      return { questionAnalytics };
    }
    
    return {};
  };

  const getQuestionTimingAnalytics = (question) => {
    const responsesWithTiming = responses.filter(r => r.questionTimes && r.questionTimes[question.id]);
    
    if (responsesWithTiming.length === 0) {
      return {
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        responseCount: 0
      };
    }
    
    const times = responsesWithTiming.map(r => r.questionTimes[question.id]);
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    return {
      avgTime: Math.round(avgTime),
      minTime,
      maxTime,
      responseCount: responsesWithTiming.length,
      times
    };
  };

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const renderResponseComparison = (response, question) => {
    const userAnswer = response.answers[question.id];
    const analytics = getQuestionAnalytics(question);
    
    if (question.type === 'categorize') {
      const correctMap = question.data.correctMap;
      
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Item Placements</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(correctMap).map(item => {
              const userCategory = userAnswer?.[item];
              const correctCategory = correctMap[item];
              const isCorrect = userCategory === correctCategory;
              
              return (
                <div key={item} className={`p-3 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="font-medium text-gray-900 mb-1">{item}</div>
                  <div className="text-sm space-y-1">
                    <div className={`flex items-center ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      <span className="font-medium">Your answer:</span>
                      <span className="ml-2">{userCategory || 'Not answered'}</span>
                      {isCorrect && <span className="ml-2">✓</span>}
                    </div>
                    {!isCorrect && (
                      <div className="text-green-700">
                        <span className="font-medium">Correct answer:</span>
                        <span className="ml-2">{correctCategory}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    if (question.type === 'cloze') {
      const correctAnswers = question.data.answers || [];
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
      
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Fill-in-the-Blanks</h4>
          <div className="space-y-3">
            {correctAnswers.map((correctAnswer, index) => {
              const userBlankAnswer = userAnswers[index];
              const isCorrect = userBlankAnswer === correctAnswer;
              
              return (
                <div key={index} className={`p-3 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="font-medium text-gray-900 mb-1">Blank {index + 1}</div>
                  <div className="text-sm space-y-1">
                    <div className={`flex items-center ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      <span className="font-medium">Your answer:</span>
                      <span className="ml-2 px-2 py-1 bg-white rounded border">{userBlankAnswer || 'Empty'}</span>
                      {isCorrect && <span className="ml-2">✓</span>}
                    </div>
                    {!isCorrect && (
                      <div className="text-green-700">
                        <span className="font-medium">Correct answer:</span>
                        <span className="ml-2 px-2 py-1 bg-white rounded border">{correctAnswer}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    if (question.type === 'comprehension') {
      let userAnswers = [];
      
      // Handle both array and object formats for backward compatibility
      if (Array.isArray(userAnswer)) {
        userAnswers = userAnswer;
      } else if (userAnswer && typeof userAnswer === 'object') {
        // Convert object format {0: 1, 1: 2} to array format [1, 2]
        userAnswers = [];
        question.data.questions.forEach((_, index) => {
          userAnswers[index] = userAnswer[index];
        });
      }
      
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Multiple Choice Answers</h4>
          <div className="space-y-3">
            {question.data.questions.map((q, qIndex) => {
              const userChoice = userAnswers[qIndex];
              const correctChoice = q.correct;
              const isCorrect = userChoice === correctChoice;
              
              return (
                <div key={qIndex} className={`p-3 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="font-medium text-gray-900 mb-2">{q.question}</div>
                  <div className="text-sm space-y-1">
                    <div className={`flex items-center ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      <span className="font-medium">Your answer:</span>
                      <span className="ml-2">
                        {typeof userChoice === 'number' ? 
                          `${String.fromCharCode(65 + userChoice)}. ${q.choices[userChoice]}` : 
                          'Not answered'}
                      </span>
                      {isCorrect && <span className="ml-2">✓</span>}
                    </div>
                    {!isCorrect && (
                      <div className="text-green-700">
                        <span className="font-medium">Correct answer:</span>
                        <span className="ml-2">
                          {String.fromCharCode(65 + correctChoice)}. {q.choices[correctChoice]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    return null;
  };

  const analytics = calculateAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600">The form you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{form.title} - Analytics</h1>
              <p className="text-gray-600 mt-1">Detailed insights and response analysis</p>
            </div>
          </div>
          <div className="flex space-x-3">
            {responses.length > 0 && (
              <button
                onClick={() => exportResponsesToCSV(responses, form.title)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            )}
            <Link
              to={`/form/${formId}`}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <EyeIcon className="h-4 w-4" />
              <span>Preview Form</span>
            </Link>
          </div>
        </div>

        {analytics ? (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Responses</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalResponses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AcademicCapIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.avgScore}/{form.questions.reduce((sum, q) => sum + (q.points || 1), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pass Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.passRate}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg. Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.floor(analytics.avgTime / 60)}m {analytics.avgTime % 60}s
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">{analytics.scoreDistribution.excellent}</div>
                  <div className="text-sm text-gray-600">Excellent (90%+)</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.scoreDistribution.excellent / analytics.totalResponses) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{analytics.scoreDistribution.good}</div>
                  <div className="text-sm text-gray-600">Good (70-89%)</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.scoreDistribution.good / analytics.totalResponses) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">{analytics.scoreDistribution.fair}</div>
                  <div className="text-sm text-gray-600">Fair (50-69%)</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.scoreDistribution.fair / analytics.totalResponses) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">{analytics.scoreDistribution.poor}</div>
                  <div className="text-sm text-gray-600">Poor (&lt;50%)</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.scoreDistribution.poor / analytics.totalResponses) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Analytics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Question Performance Analysis</h3>
                <p className="text-gray-600 mt-1">Click on any question to see detailed analytics</p>
              </div>
              <div className="divide-y divide-gray-200">
                {form.questions.map((question, index) => {
                  const analytics = getQuestionAnalytics(question);
                  const timingAnalytics = getQuestionTimingAnalytics(question);
                  const isExpanded = expandedQuestions[question.id];
                  
                  let avgAccuracy = 0;
                  if (question.type === 'categorize' && analytics.itemAnalytics) {
                    const accuracies = Object.values(analytics.itemAnalytics).map(item => item.accuracy);
                    avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
                  } else if (question.type === 'cloze' && analytics.blankAnalytics) {
                    const accuracies = analytics.blankAnalytics.map(blank => blank.accuracy);
                    avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
                  } else if (question.type === 'comprehension' && analytics.questionAnalytics) {
                    const accuracies = analytics.questionAnalytics.map(q => q.accuracy);
                    avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
                  }

                  return (
                    <div key={question.id} className="p-6">
                      <button
                        onClick={() => toggleQuestionExpansion(question.id)}
                        className="w-full flex items-center justify-between text-left hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Question {index + 1}: {question.title || `${question.type.charAt(0).toUpperCase() + question.type.slice(1)} Question`}
                            </h4>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500 capitalize">{question.type}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">{question.points || 1} points</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {Math.round(avgAccuracy)}% Average Accuracy
                            </div>
                            <div className="text-xs text-gray-500">
                              {responses.filter(r => r.answers[question.id]).length} responses
                            </div>
                            {timingAnalytics.responseCount > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                Avg: {formatTime(timingAnalytics.avgTime)}
                              </div>
                            )}
                          </div>
                          <div className={`w-3 h-3 rounded-full ${
                            avgAccuracy >= 80 ? 'bg-green-500' :
                            avgAccuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-6 pl-9">
                          {/* Timing Analytics - Common for all question types */}
                          {timingAnalytics.responseCount > 0 && (
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                              <h5 className="font-medium text-gray-900 mb-3">Time Analytics</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-blue-600">
                                    {formatTime(timingAnalytics.avgTime)}
                                  </div>
                                  <div className="text-sm text-gray-600">Average Time</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-green-600">
                                    {formatTime(timingAnalytics.minTime)}
                                  </div>
                                  <div className="text-sm text-gray-600">Fastest</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-red-600">
                                    {formatTime(timingAnalytics.maxTime)}
                                  </div>
                                  <div className="text-sm text-gray-600">Slowest</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-gray-700">
                                    {timingAnalytics.responseCount}
                                  </div>
                                  <div className="text-sm text-gray-600">Responses</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {question.type === 'categorize' && analytics.itemAnalytics && (
                            <div className="space-y-4">
                              <h5 className="font-medium text-gray-900">Item Placement Analysis</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(analytics.itemAnalytics).map(([item, data]) => (
                                  <div key={item} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-gray-900">{item}</span>
                                      <span className={`text-sm font-medium ${
                                        data.accuracy >= 80 ? 'text-green-600' :
                                        data.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                                      }`}>
                                        {data.accuracy}% correct
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <div>Correct placements: {data.correctPlacements}/{responses.length}</div>
                                      <div className="mt-2">
                                        <div className="font-medium text-gray-700 mb-1">Category distribution:</div>
                                        {Object.entries(data.categoryDistribution).map(([category, count]) => (
                                          <div key={category} className="flex justify-between">
                                            <span>{category}:</span>
                                            <span>{count} ({Math.round((count / responses.length) * 100)}%)</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {question.type === 'cloze' && analytics.blankAnalytics && (
                            <div className="space-y-4">
                              <h5 className="font-medium text-gray-900">Blank Fill Analysis</h5>
                              <div className="space-y-3">
                                {analytics.blankAnalytics.map((blank, blankIndex) => (
                                  <div key={blankIndex} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-gray-900">Blank {blankIndex + 1}</span>
                                      <span className={`text-sm font-medium ${
                                        blank.accuracy >= 80 ? 'text-green-600' :
                                        blank.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                                      }`}>
                                        {blank.accuracy}% correct
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <div>Correct answer: <span className="font-medium">{blank.correctAnswer}</span></div>
                                      <div>Correct responses: {blank.correctCount}/{responses.length}</div>
                                      <div className="mt-2">
                                        <div className="font-medium text-gray-700 mb-1">Answer distribution:</div>
                                        {Object.entries(blank.answerDistribution).map(([answer, count]) => (
                                          <div key={answer} className="flex justify-between">
                                            <span>{answer}:</span>
                                            <span>{count} ({Math.round((count / responses.length) * 100)}%)</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {question.type === 'comprehension' && analytics.questionAnalytics && (
                            <div className="space-y-4">
                              <h5 className="font-medium text-gray-900">Multiple Choice Analysis</h5>
                              <div className="space-y-3">
                                {analytics.questionAnalytics.map((qData, qIndex) => (
                                  <div key={qIndex} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-gray-900">Q{qIndex + 1}</span>
                                      <span className={`text-sm font-medium ${
                                        qData.accuracy >= 80 ? 'text-green-600' :
                                        qData.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                                      }`}>
                                        {qData.accuracy}% correct
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <div className="mb-2">{qData.question}</div>
                                      <div>Correct responses: {qData.correctCount}/{responses.length}</div>
                                      <div className="mt-2">
                                        <div className="font-medium text-gray-700 mb-1">Choice distribution:</div>
                                        {Object.entries(qData.choiceDistribution).map(([choiceIndex, count]) => {
                                          const choiceText = question.data.questions[qIndex].choices[parseInt(choiceIndex)];
                                          const isCorrect = parseInt(choiceIndex) === qData.correctChoice;
                                          return (
                                            <div key={choiceIndex} className="flex justify-between">
                                              <span className={isCorrect ? 'font-medium text-green-700' : ''}>
                                                {String.fromCharCode(65 + parseInt(choiceIndex))}. {choiceText}:
                                              </span>
                                              <span className={isCorrect ? 'font-medium text-green-700' : ''}>
                                                {count} ({Math.round((count / responses.length) * 100)}%)
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Responses */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Individual Responses</h3>
                <p className="text-gray-600 mt-1">Detailed breakdown of each submission</p>
              </div>
              <div className="divide-y divide-gray-200">
                {responses.map((response, index) => (
                  <div key={response._id} className="p-6">
                    <button
                      onClick={() => setSelectedResponse(selectedResponse === response._id ? null : response._id)}
                      className="w-full flex items-center justify-between text-left hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {selectedResponse === response._id ? (
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{response.submitterName}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">{response.submitterEmail}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {new Date(response.submittedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {response.score}/{response.maxScore} ({Math.round((response.score / response.maxScore) * 100)}%)
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.floor(response.timeSpent / 60)}m {response.timeSpent % 60}s
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          (response.score / response.maxScore) >= 0.8 ? 'bg-green-500' :
                          (response.score / response.maxScore) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    </button>

                    {selectedResponse === response._id && (
                      <div className="mt-6 pl-9 space-y-6">
                        {form.questions.map((question, qIndex) => (
                          <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="font-medium text-gray-900">
                                Question {qIndex + 1}: {question.title || `${question.type.charAt(0).toUpperCase() + question.type.slice(1)} Question`}
                              </h5>
                              <span className="text-sm text-gray-500 capitalize">{question.type}</span>
                            </div>
                            {renderResponseComparison(response, question)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Responses Yet</h3>
            <p className="text-gray-600 mb-6">
              Once people start taking your form, analytics will appear here.
            </p>
            <Link
              to={`/form/${formId}`}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <EyeIcon className="h-5 w-5" />
              <span>Preview Form</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormAnalytics;
