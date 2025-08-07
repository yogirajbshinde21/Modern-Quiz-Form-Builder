import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import CategorizeRenderer from './renderers/CategorizeRenderer';
import ClozeRenderer from './renderers/ClozeRenderer';
import ComprehensionRenderer from './renderers/ComprehensionRenderer';
import { getForm, submitResponse } from '../services/api';

const FormRenderer = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitterInfo, setSubmitterInfo] = useState({
    name: '',
    email: ''
  });
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  
  // Question-wise timing tracking
  const [questionTimes, setQuestionTimes] = useState({});
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState(null);

  // Effect to track question timing when currentQuestion changes
  useEffect(() => {
    if (form && form.questions[currentQuestion]) {
      const currentQuestionId = form.questions[currentQuestion].id;
      console.log(`Starting timer for question ${currentQuestionId} at position ${currentQuestion}`);
      setCurrentQuestionStartTime(Date.now());
    }
  }, [currentQuestion, form]);

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      const formData = await getForm(formId);
      setForm(formData);
      // Initialize answers object
      const initialAnswers = {};
      const initialQuestionTimes = {};
      formData.questions.forEach(q => {
        initialAnswers[q.id] = null;
        initialQuestionTimes[q.id] = 0; // Initialize with 0 seconds spent
      });
      setAnswers(initialAnswers);
      setQuestionTimes(initialQuestionTimes);
      // Timer will start automatically via useEffect when currentQuestion/form changes
    } catch (error) {
      console.error('Failed to load form:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to save time spent on current question
  const saveCurrentQuestionTime = () => {
    if (currentQuestionStartTime && form && form.questions[currentQuestion]) {
      const currentQuestionId = form.questions[currentQuestion].id;
      const timeSpentOnCurrentQuestion = Math.floor((Date.now() - currentQuestionStartTime) / 1000);
      
      console.log(`Saving time for question ${currentQuestionId}: ${timeSpentOnCurrentQuestion} seconds`);
      
      setQuestionTimes(prev => {
        const newTimes = {
          ...prev,
          [currentQuestionId]: prev[currentQuestionId] + timeSpentOnCurrentQuestion
        };
        console.log('Updated question times:', newTimes);
        return newTimes;
      });
    }
  };

  const updateAnswer = (questionId, answer) => {
    console.log(`Answer updated for question ${questionId}:`, answer);
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < form.questions.length - 1) {
      // Save time spent on current question before moving
      saveCurrentQuestionTime();
      setCurrentQuestion(prev => prev + 1);
      // Timer will start automatically via useEffect
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      // Save time spent on current question before moving
      saveCurrentQuestionTime();
      setCurrentQuestion(prev => prev - 1);
      // Timer will start automatically via useEffect
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault(); // Prevent form submission if called from form
    
    if (submitted) {
      console.log('Form already submitted, ignoring...');
      return;
    }

    if (!submitterInfo.name || !submitterInfo.email) {
      alert('Please provide your name and email');
      return;
    }

    if (!submitterInfo.email.includes('@')) {
      alert('Please provide a valid email address');
      return;
    }

    console.log('Starting form submission...');
    setSubmitted(true); // Prevent double submission

    // Calculate final question times including the current question
    let finalQuestionTimes = { ...questionTimes };
    if (currentQuestionStartTime && form && form.questions[currentQuestion]) {
      const currentQuestionId = form.questions[currentQuestion].id;
      const timeSpentOnCurrentQuestion = Math.floor((Date.now() - currentQuestionStartTime) / 1000);
      
      console.log(`Final time for question ${currentQuestionId}: ${timeSpentOnCurrentQuestion} seconds`);
      
      finalQuestionTimes = {
        ...finalQuestionTimes,
        [currentQuestionId]: (finalQuestionTimes[currentQuestionId] || 0) + timeSpentOnCurrentQuestion
      };
      
      // Update the state to reflect final times
      setQuestionTimes(finalQuestionTimes);
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      console.log('Final question times before submission:', finalQuestionTimes);
      console.log('Submitting with data:', {
        answers,
        submitterName: submitterInfo.name,
        submitterEmail: submitterInfo.email,
        timeSpent,
        questionTimes: finalQuestionTimes
      });

      const response = await submitResponse(formId, {
        answers,
        submitterName: submitterInfo.name,
        submitterEmail: submitterInfo.email,
        timeSpent,
        questionTimes: finalQuestionTimes // Include question-wise timing data
      });
      
      console.log('Submission successful:', response);
      setResults(response);
      
      // Redirect to response analytics page after a short delay
      setTimeout(() => {
        navigate(`/response/${formId}/${response._id}`);
      }, 1500);
      
    } catch (error) {
      console.error('Failed to submit response:', error);
      setSubmitted(false); // Allow retry on error
      alert('Failed to submit form. Please try again.');
    }
  };

  const renderQuestion = (question) => {
    const commonProps = {
      question,
      answer: answers[question.id],
      onAnswerChange: (answer) => updateAnswer(question.id, answer)
    };

    switch (question.type) {
      case 'categorize':
        return <CategorizeRenderer {...commonProps} />;
      case 'cloze':
        return <ClozeRenderer {...commonProps} />;
      case 'comprehension':
        return <ComprehensionRenderer {...commonProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
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

  if (submitted && !showResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Submitted!</h1>
            <p className="text-gray-600 mb-4">Thank you for your submission.</p>
            {results && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-900 font-medium">
                  Your Score: {results.score}/{results.maxScore} ({Math.round((results.score/results.maxScore) * 100)}%)
                </p>
              </div>
            )}
            <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Redirecting to your detailed results...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / form.questions.length) * 100;
  const currentQ = form.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{form.title}</h1>
                {form.description && (
                  <p className="text-gray-600 mt-1">{form.description}</p>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {form.questions.length}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Header Image */}
      {form.headerImage && (
        <div className="max-w-4xl mx-auto px-6 py-6">
          <img 
            src={form.headerImage} 
            alt="Form header" 
            className="w-full h-48 object-cover rounded-lg shadow-sm"
          />
        </div>
      )}

      {/* Question */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Question Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {currentQ.type.charAt(0).toUpperCase() + currentQ.type.slice(1)}
              </span>
              <span className="text-sm text-gray-500">{currentQ.points} {currentQ.points === 1 ? 'point' : 'points'}</span>
            </div>
            
            {currentQ.title && (
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentQ.title}</h2>
            )}
            
            {currentQ.image && (
              <img 
                src={currentQ.image} 
                alt="Question" 
                className="w-full max-w-md h-48 object-cover rounded-lg mb-4"
              />
            )}
          </div>

          {/* Question Content */}
          {renderQuestion(currentQ)}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              {currentQuestion === form.questions.length - 1 ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={submitterInfo.name}
                      onChange={(e) => setSubmitterInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      required
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      value={submitterInfo.email}
                      onChange={(e) => setSubmitterInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Your email"
                      required
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!submitterInfo.name || !submitterInfo.email || submitted}
                    className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitted ? 'Submitting...' : 'Submit Form'}
                  </button>
                </form>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormRenderer;
