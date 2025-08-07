import { useState, useRef, useEffect } from 'react';
import { PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';

const ClozeQuestion = ({ question, onUpdate, onImageUpload, onGenerateDistractors }) => {
  const [selectedText, setSelectedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef(null);

  // Ensure correct answers are always included in options
  useEffect(() => {
    const currentOptions = question.data.options || [];
    const currentAnswers = question.data.answers || [];
    
    // Check if any answers are missing from options
    const missingAnswers = currentAnswers.filter(answer => 
      answer && answer.trim() && !currentOptions.includes(answer.trim())
    );
    
    if (missingAnswers.length > 0) {
      const updatedOptions = [...currentOptions, ...missingAnswers];
      onUpdate({
        data: {
          ...question.data,
          options: updatedOptions
        }
      });
    }
  }, [question.data.answers, question.data.options, onUpdate]);

  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);
      setSelectedText(selected);
    }
  };

  const makeBlank = () => {
    if (!selectedText.trim()) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = question.data.text;
    
    // Replace selected text with blank
    const newText = currentText.substring(0, start) + '_____' + currentText.substring(end);
    
    // Add to answers array
    const newAnswers = [...question.data.answers, selectedText.trim()];
    
    // Ensure the correct answer is also in the options array
    const newOptions = [...question.data.options];
    if (!newOptions.includes(selectedText.trim())) {
      newOptions.push(selectedText.trim());
    }
    
    onUpdate({
      data: {
        ...question.data,
        text: newText,
        answers: newAnswers,
        options: newOptions
      }
    });
    
    setSelectedText('');
  };

  const generateDistractors = async () => {
    if (question.data.answers.length === 0) return;
    
    setIsGenerating(true);
    try {
      const distractors = await onGenerateDistractors(question.data.text, question.data.answers);
      const newOptions = [...question.data.answers];
      
      // Add generated distractors
      distractors.forEach(distractorSet => {
        newOptions.push(...distractorSet);
      });
      
      onUpdate({
        data: {
          ...question.data,
          options: [...new Set(newOptions)] // Remove duplicates
        }
      });
    } catch (error) {
      console.error('Failed to generate distractors:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateOption = (index, value) => {
    const oldOption = question.data.options[index];
    const newOptions = [...question.data.options];
    newOptions[index] = value;
    
    // If this option was in the answers array, update it there too
    const newAnswers = [...question.data.answers];
    const answerIndex = newAnswers.indexOf(oldOption);
    if (answerIndex !== -1) {
      newAnswers[answerIndex] = value;
    }
    
    onUpdate({
      data: {
        ...question.data,
        options: newOptions,
        answers: newAnswers
      }
    });
  };

  const removeOption = (index) => {
    const optionToRemove = question.data.options[index];
    const newOptions = question.data.options.filter((_, i) => i !== index);
    
    // Also remove from answers if it was marked as correct
    const newAnswers = question.data.answers.filter(answer => answer !== optionToRemove);
    
    onUpdate({
      data: {
        ...question.data,
        options: newOptions,
        answers: newAnswers
      }
    });
  };

  const addOption = () => {
    onUpdate({
      data: {
        ...question.data,
        options: [...question.data.options, '']
      }
    });
  };

  const removeAnswer = (index) => {
    const removedAnswer = question.data.answers[index];
    const newAnswers = question.data.answers.filter((_, i) => i !== index);
    
    // Remove from options as well if it's not a manually added distractor
    const newOptions = question.data.options.filter(option => option !== removedAnswer);
    
    onUpdate({
      data: {
        ...question.data,
        answers: newAnswers,
        options: newOptions
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

      {/* Text with Blanks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text (select words to make them blanks)
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={question.data.text}
            onChange={(e) => onUpdate({ data: { ...question.data, text: e.target.value } })}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            placeholder="Type your sentence here. Select words to turn them into blanks..."
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {selectedText && (
            <button
              onClick={makeBlank}
              className="absolute top-2 right-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            >
              Make "{selectedText}" a blank
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          💡 Tip: Select text and click "Make blank" to create fill-in-the-blank questions
        </p>
      </div>

      {/* Correct Answers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Correct Answers ({question.data.answers.length})
          </label>
          <button
            onClick={generateDistractors}
            disabled={isGenerating || question.data.answers.length === 0}
            className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 transition-colors text-sm"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>{isGenerating ? 'Generating...' : 'Generate Wrong Options'}</span>
          </button>
        </div>
        {question.data.answers.length > 0 ? (
          <div className="space-y-2">
            {question.data.answers.map((answer, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-sm text-green-600 font-medium">✓</span>
                <div className="flex-1 px-3 py-2 border border-green-300 rounded-md bg-green-50 text-gray-800">
                  {answer}
                </div>
                <button
                  onClick={() => removeAnswer(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                  title="Remove correct answer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-md">
            No correct answers selected. Mark options as correct in the "All Options" section below.
          </div>
        )}
      </div>

      {/* All Options (for drag-and-drop) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            All Options (click to mark as correct/incorrect)
          </label>
          <button
            onClick={addOption}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            Add Option
          </button>
        </div>
        <div className="space-y-2">
          {question.data.options.map((option, index) => {
            const isCorrect = question.data.answers.includes(option);
            return (
              <div key={index} className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const newAnswers = [...question.data.answers];
                    if (isCorrect) {
                      // Remove from correct answers
                      const answerIndex = newAnswers.indexOf(option);
                      if (answerIndex > -1) {
                        newAnswers.splice(answerIndex, 1);
                      }
                    } else {
                      // Add to correct answers
                      newAnswers.push(option);
                    }
                    onUpdate({
                      data: {
                        ...question.data,
                        answers: newAnswers
                      }
                    });
                  }}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                    isCorrect 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300 text-gray-400 hover:border-green-400'
                  }`}
                  title={isCorrect ? 'Click to mark as incorrect' : 'Click to mark as correct'}
                >
                  {isCorrect ? '✓' : '○'}
                </button>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent ${
                    isCorrect 
                      ? 'border-green-300 bg-green-50 focus:ring-green-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter option text..."
                />
                <button
                  onClick={() => removeOption(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                  title="Remove option"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Click the circle next to each option to mark it as correct (✓) or incorrect (○)
        </p>
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

export default ClozeQuestion;
