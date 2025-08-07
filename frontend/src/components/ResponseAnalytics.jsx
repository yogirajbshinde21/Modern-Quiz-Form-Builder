import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UserIcon, 
  AcademicCapIcon,
  ClockIcon,
  ArrowLeftIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { getForm, getFormResponses } from '../services/api';

const ResponseAnalytics = () => {
  const { formId, responseId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [formId, responseId]);

  const loadData = async () => {
    try {
      const [formData, responsesData] = await Promise.all([
        getForm(formId),
        getFormResponses(formId)
      ]);
      
      setForm(formData);
      
      // Find the specific response
      const specificResponse = responsesData.find(r => r._id === responseId);
      if (!specificResponse) {
        navigate(`/form/${formId}`);
        return;
      }
      
      setResponse(specificResponse);
    } catch (error) {
      console.error('Failed to load response analytics data:', error);
      navigate(`/form/${formId}`);
    } finally {
      setLoading(false);
    }
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

  const renderQuestionAnalysis = (question, userAnswer) => {
    if (question.type === 'categorize') {
      const correctMap = question.data.correctMap;
      
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Your Item Placements</h4>
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
                      {isCorrect ? (
                        <CheckCircleIcon className="h-4 w-4 ml-2" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 ml-2" />
                      )}
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
          <h4 className="font-medium text-gray-900">Your Fill-in-the-Blanks</h4>
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
                      {isCorrect ? (
                        <CheckCircleIcon className="h-4 w-4 ml-2" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 ml-2" />
                      )}
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
          <h4 className="font-medium text-gray-900">Your Multiple Choice Answers</h4>
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
                      {isCorrect ? (
                        <CheckCircleIcon className="h-4 w-4 ml-2" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 ml-2" />
                      )}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!form || !response) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Results Not Found</h1>
          <p className="text-gray-600 mb-4">Your response results could not be found.</p>
          <Link
            to={`/form/${formId}`}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Take Form Again</span>
          </Link>
        </div>
      </div>
    );
  }

  const percentage = response.maxScore > 0 ? Math.round((response.score / response.maxScore) * 100) : 0;
  const performanceColor = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
  const performanceText = percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to={`/form/${formId}`}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Results</h1>
              <p className="text-gray-600 mt-1">{form.title}</p>
            </div>
          </div>
          <Link
            to={`/form/${formId}`}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <EyeIcon className="h-4 w-4" />
            <span>Take Again</span>
          </Link>
        </div>

        {/* Score Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8 text-center">
          <div className="mb-6">
            <div className={`text-6xl font-bold ${performanceColor} mb-2`}>
              {percentage}%
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-2">
              {response.score} out of {response.maxScore} points
            </div>
            <div className={`text-lg ${performanceColor} font-medium`}>
              {performanceText}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center justify-center space-x-3">
              <UserIcon className="h-6 w-6 text-blue-600" />
              <div>
                <div className="text-sm text-gray-500">Submitted by</div>
                <div className="font-medium text-gray-900">{response.submitterName}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-3">
              <ClockIcon className="h-6 w-6 text-orange-600" />
              <div>
                <div className="text-sm text-gray-500">Total time</div>
                <div className="font-medium text-gray-900">
                  {formatTime(response.timeSpent)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-3">
              <ClockIcon className="h-6 w-6 text-purple-600" />
              <div>
                <div className="text-sm text-gray-500">Avg per question</div>
                <div className="font-medium text-gray-900">
                  {formatTime(Math.round(response.timeSpent / form.questions.length))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-3">
              <AcademicCapIcon className="h-6 w-6 text-green-600" />
              <div>
                <div className="text-sm text-gray-500">Questions</div>
                <div className="font-medium text-gray-900">{form.questions.length} total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Timing Breakdown */}
        {response.questionTimes && Object.keys(response.questionTimes).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Time Spent per Question
            </h3>
            <div className="space-y-3">
              {form.questions.map((question, index) => {
                const timeSpent = response.questionTimes[question.id] || 0;
                const maxTime = Math.max(...Object.values(response.questionTimes));
                const percentage = maxTime > 0 ? (timeSpent / maxTime) * 100 : 0;
                
                return (
                  <div key={question.id} className="flex items-center space-x-4">
                    <div className="w-20 text-sm text-gray-600">
                      Q{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {question.title || `${question.type.charAt(0).toUpperCase() + question.type.slice(1)} Question`}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          {formatTime(timeSpent)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Timing Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {formatTime(Math.min(...Object.values(response.questionTimes)))}
                  </div>
                  <div className="text-gray-600">Fastest</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {formatTime(Math.max(...Object.values(response.questionTimes)))}
                  </div>
                  <div className="text-gray-600">Slowest</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {formatTime(Math.round(Object.values(response.questionTimes).reduce((a, b) => a + b, 0) / Object.values(response.questionTimes).length))}
                  </div>
                  <div className="text-gray-600">Average</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {formatTime(response.timeSpent)}
                  </div>
                  <div className="text-gray-600">Total</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question-by-Question Analysis */}
        <div className="space-y-6">
          {form.questions.map((question, index) => {
            const userAnswer = response.answers[question.id];
            
            return (
              <div key={question.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Question {index + 1}
                    </h3>
                    <p className="text-gray-600 text-sm capitalize">
                      {question.type} • {question.points || 1} point{(question.points || 1) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    {response.questionTimes && response.questionTimes[question.id] && (
                      <div className="flex items-center space-x-2 text-sm">
                        <ClockIcon className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-600 font-medium">
                          {formatTime(response.questionTimes[question.id])}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {question.title && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900">{question.title}</h4>
                  </div>
                )}

                {question.image && (
                  <div className="mb-4">
                    <img 
                      src={question.image} 
                      alt="Question" 
                      className="w-full max-w-md h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Question-specific content */}
                {question.type === 'cloze' && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">{question.data.text}</p>
                  </div>
                )}

                {question.type === 'comprehension' && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{question.data.passage}</p>
                  </div>
                )}

                {/* Answer analysis */}
                {renderQuestionAnalysis(question, userAnswer)}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            to={`/form/${formId}`}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Take Form Again
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Explore More Forms
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResponseAnalytics;
