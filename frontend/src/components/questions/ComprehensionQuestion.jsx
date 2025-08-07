import { useState } from 'react';
import { PlusIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';

const ComprehensionQuestion = ({ question, onUpdate, onImageUpload }) => {
  const addQuestion = () => {
    const newQuestionObj = {
      question: '',
      choices: ['', '', '', ''],
      correct: 0
    };
    
    onUpdate({
      data: {
        ...question.data,
        questions: [...question.data.questions, newQuestionObj]
      }
    });
  };

  const updateQuestion = (qIndex, field, value) => {
    const updatedQuestions = [...question.data.questions];
    updatedQuestions[qIndex] = {
      ...updatedQuestions[qIndex],
      [field]: value
    };
    
    onUpdate({
      data: {
        ...question.data,
        questions: updatedQuestions
      }
    });
  };

  const updateChoice = (qIndex, choiceIndex, value) => {
    const updatedQuestions = [...question.data.questions];
    updatedQuestions[qIndex].choices[choiceIndex] = value;
    
    onUpdate({
      data: {
        ...question.data,
        questions: updatedQuestions
      }
    });
  };

  const removeQuestion = (qIndex) => {
    const updatedQuestions = question.data.questions.filter((_, i) => i !== qIndex);
    onUpdate({
      data: {
        ...question.data,
        questions: updatedQuestions
      }
    });
  };

  const addChoice = (qIndex) => {
    const updatedQuestions = [...question.data.questions];
    updatedQuestions[qIndex].choices.push('');
    
    onUpdate({
      data: {
        ...question.data,
        questions: updatedQuestions
      }
    });
  };

  const removeChoice = (qIndex, choiceIndex) => {
    const updatedQuestions = [...question.data.questions];
    const choices = updatedQuestions[qIndex].choices.filter((_, i) => i !== choiceIndex);
    
    // Adjust correct answer index if needed
    let correctIndex = updatedQuestions[qIndex].correct;
    if (correctIndex === choiceIndex) {
      correctIndex = 0; // Reset to first choice
    } else if (correctIndex > choiceIndex) {
      correctIndex = correctIndex - 1; // Shift down
    }
    
    updatedQuestions[qIndex] = {
      ...updatedQuestions[qIndex],
      choices,
      correct: correctIndex
    };
    
    onUpdate({
      data: {
        ...question.data,
        questions: updatedQuestions
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Question Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Title
        </label>
        <input
          type="text"
          value={question.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Enter question title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Question Image */}
      <div className="flex items-center space-x-4">
        {question.image ? (
          <img src={question.image} alt="Question" className="h-20 w-28 object-cover rounded-md" />
        ) : (
          <div className="h-20 w-28 bg-gray-100 rounded-md flex items-center justify-center">
            <PhotoIcon className="h-6 w-6 text-gray-400" />
          </div>
        )}
        <label className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200 transition-colors text-sm">
          Upload Image
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onImageUpload(e.target.files[0])}
            className="hidden"
          />
        </label>
      </div>

      {/* Passage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reading Passage
        </label>
        <textarea
          value={question.data.passage}
          onChange={(e) => onUpdate({ data: { ...question.data, passage: e.target.value } })}
          placeholder="Enter the reading passage here..."
          rows="8"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Students will read this passage before answering the questions below
        </p>
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Comprehension Questions ({question.data.questions.length})
          </label>
          <button
            onClick={addQuestion}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Question</span>
          </button>
        </div>

        <div className="space-y-6">
          {question.data.questions.map((q, qIndex) => (
            <div key={qIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Question {qIndex + 1}</h4>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-4">
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  placeholder="Enter question..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Choices */}
              <div className="space-y-2">
                {q.choices.map((choice, choiceIndex) => (
                  <div key={choiceIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={q.correct === choiceIndex}
                      onChange={() => updateQuestion(qIndex, 'correct', choiceIndex)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-600 w-6">
                      {String.fromCharCode(65 + choiceIndex)}.
                    </span>
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => updateChoice(qIndex, choiceIndex, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + choiceIndex)}`}
                      className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent ${
                        q.correct === choiceIndex
                          ? 'border-green-300 bg-green-50 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {q.choices.length > 2 && (
                      <button
                        onClick={() => removeChoice(qIndex, choiceIndex)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {q.choices.length < 6 && (
                  <button
                    onClick={() => addChoice(qIndex)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <PlusIcon className="h-3 w-3" />
                    <span>Add Choice</span>
                  </button>
                )}
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Select the radio button next to the correct answer
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Points
          </label>
          <input
            type="number"
            value={question.points}
            onChange={(e) => onUpdate({ points: parseInt(e.target.value) })}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback
          </label>
          <input
            type="text"
            value={question.feedback}
            onChange={(e) => onUpdate({ feedback: e.target.value })}
            placeholder="Optional feedback..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default ComprehensionQuestion;
