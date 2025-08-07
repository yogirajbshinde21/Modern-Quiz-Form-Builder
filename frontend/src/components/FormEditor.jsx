import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusIcon, TrashIcon, PhotoIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import CategorizeQuestion from './questions/CategorizeQuestion';
import ClozeQuestion from './questions/ClozeQuestion';
import ComprehensionQuestion from './questions/ComprehensionQuestion';
import CategorizeRenderer from './renderers/CategorizeRenderer';
import ClozeRenderer from './renderers/ClozeRenderer';
import ComprehensionRenderer from './renderers/ComprehensionRenderer';
import { saveForm, generateDistractors, getForm } from '../services/api';

const FormEditor = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    headerImage: '',
    questions: [],
    settings: {
      allowMultipleSubmissions: false,
      showCorrectAnswers: true,
      timeLimit: null
    }
  });
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [currentPreviewQuestion, setCurrentPreviewQuestion] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(480); // Initial width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const resizerRef = useRef(null);

  useEffect(() => {
    if (formId) {
      loadForm(formId);
    }
  }, [formId]);

  const loadForm = async (id) => {
    try {
      const formData = await getForm(id);
      
      // Fix any cloze questions that might have missing correct answers in options
      const fixedFormData = {
        ...formData,
        questions: formData.questions.map(question => {
          if (question.type === 'cloze') {
            const currentOptions = question.data.options || [];
            const currentAnswers = question.data.answers || [];
            
            // Ensure all correct answers are in the options array
            const missingAnswers = currentAnswers.filter(answer => 
              answer && answer.trim() && !currentOptions.includes(answer.trim())
            );
            
            if (missingAnswers.length > 0) {
              return {
                ...question,
                data: {
                  ...question.data,
                  options: [...currentOptions, ...missingAnswers]
                }
              };
            }
          }
          return question;
        })
      };
      
      setForm(fixedFormData);
    } catch (error) {
      console.error('Failed to load form:', error);
    }
  };

  // Resizer functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const containerRect = document.querySelector('.form-editor-container').getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      const minWidth = 300;
      const maxWidth = window.innerWidth * 0.7;
      
      setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Initialize preview answers when form changes (but preserve current question position)
  useEffect(() => {
    const initialAnswers = {};
    form.questions.forEach(q => {
      initialAnswers[q.id] = null;
    });
    
    setPreviewAnswers(prev => {
      // Preserve existing answers for questions that still exist
      const updatedAnswers = { ...initialAnswers };
      form.questions.forEach(q => {
        if (prev[q.id] !== undefined) {
          updatedAnswers[q.id] = prev[q.id];
        }
      });
      return updatedAnswers;
    });
    
    // Only reset current question if no questions exist or current question index is out of bounds
    setCurrentPreviewQuestion(prev => {
      if (form.questions.length === 0) return 0;
      if (prev >= form.questions.length) return Math.max(0, form.questions.length - 1);
      return prev; // Keep current position
    });
  }, [form.questions]);

  // Additional effect to handle edge cases in preview navigation
  useEffect(() => {
    if (form.questions.length > 0 && currentPreviewQuestion >= form.questions.length) {
      setCurrentPreviewQuestion(Math.max(0, form.questions.length - 1));
    }
  }, [currentPreviewQuestion, form.questions.length]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save form with the processFormImages logic handled on backend
      await saveForm(form);
      // Show success toast and redirect to dashboard
      navigate('/');
    } catch (error) {
      console.error('Failed to save form:', error);
    } finally {
      setSaving(false);
    }
  };

  // Convert file to base64 or temporary URL for preview during editing
  const convertFileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (file, type, questionId = null) => {
    try {
      // Convert file to data URL for temporary display in editor
      const dataUrl = await convertFileToDataUrl(file);
      
      if (type === 'header') {
        setForm(prev => ({ ...prev, headerImage: dataUrl }));
      } else if (type === 'question' && questionId) {
        updateQuestion(questionId, { image: dataUrl });
      }
      
      console.log('📎 Image attached for preview. Will upload to Cloudinary when form is saved.');
    } catch (error) {
      console.error('Image attachment failed:', error);
    }
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now().toString(),
      type,
      title: '',
      image: '',
      points: 1,
      feedback: '',
      data: getDefaultQuestionData(type)
    };
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const getDefaultQuestionData = (type) => {
    switch (type) {
      case 'categorize':
        return {
          categories: ['Category 1', 'Category 2'],
          items: ['Item 1', 'Item 2'],
          correctMap: {}
        };
      case 'cloze':
        return {
          text: 'This is a sample sentence with _____ blanks.',
          answers: ['missing'],
          options: ['missing', 'wrong1', 'wrong2']
        };
      case 'comprehension':
        return {
          passage: 'Read this passage carefully...',
          questions: [{
            question: 'What is the main idea?',
            choices: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: 0
          }]
        };
      default:
        return {};
    }
  };

  const updateQuestion = (questionId, updates) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  // Preview functions
  const updatePreviewAnswer = (questionId, answer) => {
    setPreviewAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextPreviewQuestion = () => {
    if (currentPreviewQuestion < form.questions.length - 1) {
      setCurrentPreviewQuestion(prev => prev + 1);
    }
  };

  const prevPreviewQuestion = () => {
    if (currentPreviewQuestion > 0) {
      setCurrentPreviewQuestion(prev => prev - 1);
    }
  };

  // Jump to specific question in preview
  const jumpToPreviewQuestion = (questionIndex) => {
    if (showPreview && questionIndex >= 0 && questionIndex < form.questions.length) {
      setCurrentPreviewQuestion(questionIndex);
    }
  };

  const renderPreviewQuestion = (question) => {
    const commonProps = {
      question,
      answer: previewAnswers[question.id],
      onAnswerChange: (answer) => updatePreviewAnswer(question.id, answer)
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

  const deleteQuestion = (questionId) => {
    const questionIndex = form.questions.findIndex(q => q.id === questionId);
    
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
    
    // Update preview question position if needed
    setCurrentPreviewQuestion(prev => {
      // If we deleted the current question, adjust the position
      if (questionIndex === prev && prev > 0) {
        return prev - 1; // Go to previous question
      } else if (questionIndex < prev) {
        return prev - 1; // Adjust for shifted indices
      }
      return prev; // Keep current position if unaffected
    });
    
    // Remove answer for deleted question
    setPreviewAnswers(prev => {
      const { [questionId]: deletedAnswer, ...remaining } = prev;
      return remaining;
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    const items = Array.from(form.questions);
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destinationIndex, 0, reorderedItem);

    setForm(prev => ({ ...prev, questions: items }));
    
    // Update preview question position to follow the moved question if it was the current one
    setCurrentPreviewQuestion(prev => {
      if (prev === sourceIndex) {
        return destinationIndex; // Follow the moved question
      } else if (sourceIndex < prev && destinationIndex >= prev) {
        return prev - 1; // Question moved from before to after or at current position
      } else if (sourceIndex > prev && destinationIndex <= prev) {
        return prev + 1; // Question moved from after to before or at current position
      }
      return prev; // Position unchanged
    });
  };

  const exportForm = () => {
    const dataStr = JSON.stringify(form, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.title || 'form'}.json`;
    link.click();
  };

  const importForm = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedForm = JSON.parse(e.target.result);
          
          // Clean up MongoDB-specific fields for new form creation
          const cleanedForm = {
            title: importedForm.title || '',
            description: importedForm.description || '',
            headerImage: importedForm.headerImage || '',
            settings: importedForm.settings || {
              allowMultipleSubmissions: false,
              showCorrectAnswers: true,
              timeLimit: null
            },
            questions: (importedForm.questions || []).map(question => ({
              id: question.id || Date.now().toString(),
              type: question.type,
              title: question.title || '',
              image: question.image || '',
              points: question.points || 1,
              feedback: question.feedback || '',
              data: question.data || {}
            }))
          };
          
          setForm(cleanedForm);
        } catch (error) {
          console.error('Invalid JSON file:', error);
          alert('Failed to import form: Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex form-editor-container">
      {/* Main Editor */}
      <div 
        className="flex-1 overflow-hidden"
        style={{ marginRight: showPreview ? `${sidebarWidth}px` : '0' }}
      >
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to Dashboard"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Form Editor</h1>
              </div>
              <div className="flex space-x-3">
                <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                  Import JSON
                  <input type="file" accept=".json" onChange={importForm} className="hidden" />
                </label>
                <button
                  onClick={exportForm}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    showPreview 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Form'}
                </button>
              </div>
            </div>

            {/* Form Details */}
            <div className="space-y-4">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Form Title"
                className="w-full px-4 py-3 text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Form Description"
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />

              {/* Header Image */}
              <div className="flex items-center space-x-4">
                {form.headerImage ? (
                  <img src={form.headerImage} alt="Header" className="h-24 w-32 object-cover rounded-lg" />
                ) : (
                  <div className="h-24 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                  Upload Header Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0], 'header')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Questions */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                  {form.questions.map((question, index) => (
                    <Draggable key={question.id} draggableId={question.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => jumpToPreviewQuestion(index)}
                        >
                          <div className="p-6">
                            {/* Question Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-move p-1 text-gray-400 hover:text-gray-600"
                                  onClick={(e) => e.stopPropagation()} // Prevent card click when dragging
                                >
                                  ⋮⋮
                                </div>
                                <span className="text-sm font-medium text-gray-500">
                                  Question {index + 1} • {question.type}
                                </span>
                                {showPreview && currentPreviewQuestion === index && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Previewing
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click when deleting
                                  deleteQuestion(question.id);
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>

                            {/* Question Content */}
                            <div onClick={(e) => e.stopPropagation()}>
                              {question.type === 'categorize' && (
                                <CategorizeQuestion
                                  question={question}
                                  onUpdate={(updates) => updateQuestion(question.id, updates)}
                                  onImageUpload={(file) => handleImageUpload(file, 'question', question.id)}
                                />
                              )}
                              {question.type === 'cloze' && (
                                <ClozeQuestion
                                  question={question}
                                  onUpdate={(updates) => updateQuestion(question.id, updates)}
                                  onImageUpload={(file) => handleImageUpload(file, 'question', question.id)}
                                  onGenerateDistractors={generateDistractors}
                                />
                              )}
                              {question.type === 'comprehension' && (
                                <ComprehensionQuestion
                                  question={question}
                                  onUpdate={(updates) => updateQuestion(question.id, updates)}
                                  onImageUpload={(file) => handleImageUpload(file, 'question', question.id)}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add Question Buttons */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Question</h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => addQuestion('categorize')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              >
                <PlusIcon className="h-8 w-8 mx-auto text-gray-400 group-hover:text-blue-500 mb-2" />
                <div className="text-center">
                  <div className="font-medium text-gray-900">Categorize</div>
                  <div className="text-sm text-gray-500">Drag items into categories</div>
                </div>
              </button>
              <button
                onClick={() => addQuestion('cloze')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              >
                <PlusIcon className="h-8 w-8 mx-auto text-gray-400 group-hover:text-blue-500 mb-2" />
                <div className="text-center">
                  <div className="font-medium text-gray-900">Cloze</div>
                  <div className="text-sm text-gray-500">Fill in the blanks</div>
                </div>
              </button>
              <button
                onClick={() => addQuestion('comprehension')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              >
                <PlusIcon className="h-8 w-8 mx-auto text-gray-400 group-hover:text-blue-500 mb-2" />
                <div className="text-center">
                  <div className="font-medium text-gray-900">Comprehension</div>
                  <div className="text-sm text-gray-500">Passage with MCQs</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resizer */}
      {showPreview && (
        <div
          ref={resizerRef}
          className="w-1 bg-gray-300 cursor-col-resize hover:bg-blue-500 transition-colors fixed top-0 bottom-0 z-10"
          style={{ 
            right: `${sidebarWidth}px`,
            cursor: isResizing ? 'col-resize' : 'col-resize'
          }}
          onMouseDown={() => setIsResizing(true)}
        />
      )}

      {/* Live Preview Sidebar */}
      {showPreview && (
        <div 
          ref={sidebarRef}
          className="fixed top-0 right-0 bottom-0 bg-white shadow-lg border-l border-gray-200 overflow-y-auto"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Live Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {form.questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">📝</div>
                <p className="text-gray-500">Add questions to see the preview</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Form Header in Preview */}
                <div className="border-b border-gray-200 pb-4">
                  {form.headerImage && (
                    <img 
                      src={form.headerImage} 
                      alt="Form header" 
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {form.title || 'Untitled Form'}
                  </h2>
                  {form.description && (
                    <p className="text-gray-600">{form.description}</p>
                  )}
                </div>

                {/* Question Navigation */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Question {currentPreviewQuestion + 1} of {form.questions.length}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={prevPreviewQuestion}
                      disabled={currentPreviewQuestion === 0}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={nextPreviewQuestion}
                      disabled={currentPreviewQuestion === form.questions.length - 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* Current Question Preview */}
                {form.questions[currentPreviewQuestion] && (
                  <div className="bg-gray-50 rounded-lg p-4 relative">
                    {/* Live indicator */}
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {form.questions[currentPreviewQuestion].type.charAt(0).toUpperCase() + 
                           form.questions[currentPreviewQuestion].type.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {form.questions[currentPreviewQuestion].points} {form.questions[currentPreviewQuestion].points === 1 ? 'point' : 'points'}
                        </span>
                      </div>
                      
                      {form.questions[currentPreviewQuestion].title && (
                        <h4 className="font-medium text-gray-900 mb-2">
                          {form.questions[currentPreviewQuestion].title}
                        </h4>
                      )}
                      
                      {form.questions[currentPreviewQuestion].image && (
                        <img 
                          src={form.questions[currentPreviewQuestion].image} 
                          alt="Question" 
                          className="w-full max-w-sm h-32 object-cover rounded-lg mb-4"
                        />
                      )}
                    </div>

                    {/* Render the actual question */}
                    {renderPreviewQuestion(form.questions[currentPreviewQuestion])}
                  </div>
                )}

                {/* Preview Instructions */}
                <div className="text-xs text-gray-400 mt-6 p-3 bg-gray-50 rounded-lg">
                  💡 <strong>Live Preview:</strong> Changes you make in the editor will be reflected here instantly. Click on any question in the editor to jump to it in the preview. The preview maintains your current position while editing.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormEditor;
