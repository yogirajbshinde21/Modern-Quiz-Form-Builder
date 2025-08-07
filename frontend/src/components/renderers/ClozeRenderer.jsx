import { useState, useEffect } from 'react';

const ClozeRenderer = ({ question, answer, onAnswerChange }) => {
  const [blanks, setBlanks] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [availableOptions, setAvailableOptions] = useState([]);

  useEffect(() => {
    // Initialize blanks and options
    const blankCount = (question.data.text.match(/_____/g) || []).length;
    const initialBlanks = answer || new Array(blankCount).fill('');
    setBlanks(initialBlanks);
    
    // Ensure we have options to work with
    const allOptions = question.data.options || [];
    
    // Make all options available (allow reuse of options)
    const available = allOptions.filter(opt => opt && opt.trim());
    setAvailableOptions(available);
    setSelectedOptions(initialBlanks.filter(Boolean));
  }, [question, answer]);

  const handleDragStart = (e, option) => {
    e.dataTransfer.setData('text/plain', option);
  };

  const handleDrop = (e, blankIndex) => {
    e.preventDefault();
    const option = e.dataTransfer.getData('text/plain');
    
    if (availableOptions.includes(option)) {
      const newBlanks = [...blanks];
      newBlanks[blankIndex] = option;
      
      setBlanks(newBlanks);
      onAnswerChange(newBlanks);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeFromBlank = (blankIndex) => {
    const newBlanks = [...blanks];
    newBlanks[blankIndex] = '';
    
    setBlanks(newBlanks);
    onAnswerChange(newBlanks);
  };

  const renderTextWithBlanks = () => {
    const parts = question.data.text.split('_____');
    const result = [];
    
    for (let i = 0; i < parts.length; i++) {
      result.push(
        <span key={`text-${i}`} className="text-gray-900">
          {parts[i]}
        </span>
      );
      
      if (i < parts.length - 1) {
        result.push(
          <span
            key={`blank-${i}`}
            className="inline-block mx-1 align-baseline"
          >
            <div
              className="inline-flex items-center justify-center min-w-[100px] h-8 px-3 border-2 border-dashed border-blue-300 rounded-md bg-blue-50 relative cursor-pointer hover:border-blue-400 transition-colors"
              onDrop={(e) => handleDrop(e, i)}
              onDragOver={handleDragOver}
            >
              {blanks[i] ? (
                <div className="flex items-center space-x-1">
                  <span className="text-blue-900 font-medium">{blanks[i]}</span>
                  <button
                    onClick={() => removeFromBlank(i)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <span className="text-blue-400 text-sm">Drop here</span>
              )}
            </div>
          </span>
        );
      }
    }
    
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Text with blanks */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="text-lg leading-relaxed">
          {renderTextWithBlanks()}
        </div>
      </div>

      {/* Available options */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Available Options (drag to fill blanks - options can be reused)
        </h3>
        <div className="flex flex-wrap gap-2">
          {availableOptions.map((option, index) => (
            <div
              key={`${option}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, option)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-move hover:shadow-md hover:border-blue-400 transition-all select-none"
            >
              {option}
            </div>
          ))}
          {availableOptions.length === 0 && (
            <div className="text-gray-400 text-sm py-2">
              No options available
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-500">
        💡 Drag the options above to fill in the blanks in the sentence
      </div>
    </div>
  );
};

export default ClozeRenderer;
