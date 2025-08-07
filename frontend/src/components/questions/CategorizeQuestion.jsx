import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';

const CategorizeQuestion = ({ question, onUpdate, onImageUpload }) => {
  const [newCategory, setNewCategory] = useState('');
  const [newItem, setNewItem] = useState('');

  const addCategory = () => {
    if (newCategory.trim()) {
      const updatedData = {
        ...question.data,
        categories: [...question.data.categories, newCategory.trim()]
      };
      onUpdate({ data: updatedData });
      setNewCategory('');
    }
  };

  const removeCategory = (index) => {
    const updatedCategories = question.data.categories.filter((_, i) => i !== index);
    const updatedData = {
      ...question.data,
      categories: updatedCategories
    };
    onUpdate({ data: updatedData });
  };

  const addItem = () => {
    if (newItem.trim()) {
      const updatedData = {
        ...question.data,
        items: [...question.data.items, newItem.trim()]
      };
      onUpdate({ data: updatedData });
      setNewItem('');
    }
  };

  const removeItem = (index) => {
    const itemToRemove = question.data.items[index];
    const updatedItems = question.data.items.filter((_, i) => i !== index);
    const updatedCorrectMap = { ...question.data.correctMap };
    delete updatedCorrectMap[itemToRemove];
    
    const updatedData = {
      ...question.data,
      items: updatedItems,
      correctMap: updatedCorrectMap
    };
    onUpdate({ data: updatedData });
  };

  const updateCorrectMapping = (item, category) => {
    const updatedData = {
      ...question.data,
      correctMap: {
        ...question.data.correctMap,
        [item]: category
      }
    };
    onUpdate({ data: updatedData });
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

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories
        </label>
        <div className="space-y-2">
          {question.data.categories.map((category, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={category}
                onChange={(e) => {
                  const updatedCategories = [...question.data.categories];
                  updatedCategories[index] = e.target.value;
                  onUpdate({ data: { ...question.data, categories: updatedCategories } });
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => removeCategory(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-md"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add new category..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            />
            <button
              onClick={addCategory}
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Items to Categorize
        </label>
        <div className="space-y-2">
          {question.data.items.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const updatedItems = [...question.data.items];
                  const oldItem = updatedItems[index];
                  updatedItems[index] = e.target.value;
                  
                  // Update correct mapping key if it exists
                  const updatedCorrectMap = { ...question.data.correctMap };
                  if (updatedCorrectMap[oldItem]) {
                    updatedCorrectMap[e.target.value] = updatedCorrectMap[oldItem];
                    delete updatedCorrectMap[oldItem];
                  }
                  
                  onUpdate({ 
                    data: { 
                      ...question.data, 
                      items: updatedItems,
                      correctMap: updatedCorrectMap
                    } 
                  });
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={question.data.correctMap[item] || ''}
                onChange={(e) => updateCorrectMapping(item, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select category...</option>
                {question.data.categories.map((category, catIndex) => (
                  <option key={catIndex} value={category}>{category}</option>
                ))}
              </select>
              <button
                onClick={() => removeItem(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-md"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add new item..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
            />
            <button
              onClick={addItem}
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
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

export default CategorizeQuestion;
