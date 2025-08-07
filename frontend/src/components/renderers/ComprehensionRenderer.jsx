import { useState, useEffect } from 'react';

const ComprehensionRenderer = ({ question, answer, onAnswerChange }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});

  useEffect(() => {
    if (answer) {
      if (Array.isArray(answer)) {
        // Convert array format to object format for internal state
        const answerObj = {};
        answer.forEach((value, index) => {
          answerObj[index] = value;
        });
        setSelectedAnswers(answerObj);
      } else {
        setSelectedAnswers(answer);
      }
    } else {
      // Initialize with empty answers
      const initial = {};
      question.data.questions.forEach((_, index) => {
        initial[index] = null;
      });
      setSelectedAnswers(initial);
    }
  }, [question, answer]);

  const handleAnswerSelect = (questionIndex, choiceIndex) => {
    const newAnswers = {
      ...selectedAnswers,
      [questionIndex]: choiceIndex
    };
    setSelectedAnswers(newAnswers);
    
    // Convert object to array format for backend compatibility
    const answersArray = [];
    question.data.questions.forEach((_, index) => {
      answersArray[index] = newAnswers[index];
    });
    
    onAnswerChange(answersArray);
  };

  return (
    <div className="space-y-8">
      {/* Reading Passage */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Reading Passage</h3>
        <div className="prose prose-gray max-w-none">
          {question.data.passage.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">
          Answer the following questions based on the passage:
        </h3>
        
        {question.data.questions.map((q, questionIndex) => (
          <div key={questionIndex} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                {questionIndex + 1}. {q.question}
              </h4>
            </div>

            <div className="space-y-3">
              {q.choices.map((choice, choiceIndex) => (
                <label
                  key={choiceIndex}
                  className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAnswers[questionIndex] === choiceIndex
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${questionIndex}`}
                    value={choiceIndex}
                    checked={selectedAnswers[questionIndex] === choiceIndex}
                    onChange={() => handleAnswerSelect(questionIndex, choiceIndex)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-start space-x-2">
                      <span className="font-medium text-gray-600 text-sm mt-0.5">
                        {String.fromCharCode(65 + choiceIndex)}.
                      </span>
                      <span className={`text-gray-900 ${
                        selectedAnswers[questionIndex] === choiceIndex ? 'font-medium' : ''
                      }`}>
                        {choice}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="text-sm text-gray-500">
        Questions answered: {Object.values(selectedAnswers).filter(answer => answer !== null).length} / {question.data.questions.length}
      </div>
    </div>
  );
};

export default ComprehensionRenderer;
