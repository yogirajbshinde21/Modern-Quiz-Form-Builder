import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const CategorizeRenderer = ({ question, answer, onAnswerChange }) => {
  const [itemsInCategories, setItemsInCategories] = useState(() => {
    // Initialize with all items in unassigned pool
    const initial = {
      unassigned: [...question.data.items]
    };
    
    // Initialize empty arrays for each category
    question.data.categories.forEach(category => {
      initial[category] = [];
    });

    // If there's an existing answer, apply it
    if (answer && typeof answer === 'object') {
      Object.keys(answer).forEach(item => {
        const category = answer[item];
        if (initial[category] && initial.unassigned.includes(item)) {
          initial[category].push(item);
          initial.unassigned = initial.unassigned.filter(i => i !== item);
        }
      });
    }

    return initial;
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    // Extract item name from draggableId (format: "item-{itemName}-{category}")
    const draggedItemName = result.draggableId.split('-').slice(1, -1).join('-');

    // Create new state
    const newState = { ...itemsInCategories };
    
    // Remove item from source
    const sourceItems = [...newState[sourceId]];
    const [movedItem] = sourceItems.splice(source.index, 1);
    newState[sourceId] = sourceItems;

    // Add item to destination
    const destItems = [...newState[destId]];
    destItems.splice(destination.index, 0, movedItem);
    newState[destId] = destItems;

    setItemsInCategories(newState);

    // Convert to answer format
    const answerMap = {};
    Object.keys(newState).forEach(categoryKey => {
      if (categoryKey !== 'unassigned') {
        newState[categoryKey].forEach(item => {
          answerMap[item] = categoryKey;
        });
      }
    });
    
    onAnswerChange(answerMap);
  };

  return (
    <div className="space-y-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-6">
          {/* Unassigned Items Pool */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Items to Categorize</h3>
            <Droppable droppableId="unassigned" direction="horizontal">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[60px] flex flex-wrap gap-2 p-3 border-2 border-dashed rounded-lg transition-colors ${
                    snapshot.isDraggingOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300'
                  }`}
                >
                  {itemsInCategories.unassigned?.map((item, index) => (
                    <Draggable key={`item-${item}-${index}`} draggableId={`item-${item}-unassigned`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-move transition-all select-none ${
                            snapshot.isDragging 
                              ? 'shadow-lg rotate-2 border-blue-400 z-50' 
                              : 'hover:shadow-md hover:border-blue-300'
                          }`}
                        >
                          {item}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {itemsInCategories.unassigned?.length === 0 && (
                    <div className="text-gray-400 text-sm py-2">
                      All items have been categorized
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.data.categories.map((category) => (
              <div key={category} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">{category}</h3>
                <Droppable droppableId={category}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[100px] p-3 border-2 border-dashed rounded-lg transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-gray-300'
                      }`}
                    >
                      {itemsInCategories[category]?.map((item, index) => (
                        <Draggable key={`item-${item}-${category}-${index}`} draggableId={`item-${item}-${category}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 px-3 py-2 bg-green-100 border border-green-300 rounded-lg cursor-move transition-all select-none ${
                                snapshot.isDragging 
                                  ? 'shadow-lg rotate-1 border-green-400 z-50' 
                                  : 'hover:shadow-md'
                              }`}
                            >
                              {item}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {itemsInCategories[category]?.length === 0 && (
                        <div className="text-gray-400 text-sm py-6 text-center">
                          Drop items here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      <div className="text-sm text-gray-500">
        💡 Drag items from the pool above into the appropriate categories below
      </div>
    </div>
  );
};

export default CategorizeRenderer;
