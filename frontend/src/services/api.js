const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

console.log('🔗 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE: API_BASE,
  mode: import.meta.env.MODE
});

// Form API functions
export const saveForm = async (formData) => {
  console.log('📤 Saving form to:', `${API_BASE}/forms${formData._id ? `/${formData._id}` : ''}`);
  const response = await fetch(`${API_BASE}/forms${formData._id ? `/${formData._id}` : ''}`, {
    method: formData._id ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
  
  if (!response.ok) {
    console.error('❌ Failed to save form:', response.status, response.statusText);
    throw new Error('Failed to save form');
  }
  
  return response.json();
};

export const getForm = async (formId) => {
  const response = await fetch(`${API_BASE}/forms/${formId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch form');
  }
  
  return response.json();
};

export const getAllForms = async () => {
  console.log('📥 Fetching all forms from:', `${API_BASE}/forms`);
  try {
    const response = await fetch(`${API_BASE}/forms`);
    
    console.log('📊 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch forms:', response.status, response.statusText);
      throw new Error('Failed to fetch forms');
    }
    
    const data = await response.json();
    console.log('✅ Fetched forms:', data.length, 'forms');
    return data;
  } catch (error) {
    console.error('🚨 API Error in getAllForms:', error);
    throw error;
  }
};

export const deleteForm = async (formId) => {
  const response = await fetch(`${API_BASE}/forms/${formId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete form');
  }
  
  return response.json();
};

// Response API functions
export const submitResponse = async (formId, responseData) => {
  const response = await fetch(`${API_BASE}/forms/${formId}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(responseData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit response');
  }
  
  return response.json();
};

export const getFormResponses = async (formId) => {
  const response = await fetch(`${API_BASE}/forms/${formId}/responses`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch responses');
  }
  
  return response.json();
};

export const getAllResponses = async () => {
  const response = await fetch(`${API_BASE}/forms/responses/all`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch all responses');
  }
  
  return response.json();
};

// Image upload
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`${API_BASE}/forms/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload image');
  }
  
  const data = await response.json();
  return data.url;
};

// AI-powered features
export const generateDistractors = async (text, correctAnswers) => {
  const response = await fetch(`${API_BASE}/forms/generate-distractors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, correctAnswers }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate distractors');
  }
  
  const data = await response.json();
  return data.distractors;
};

// Utility functions
export const calculateScore = (answers, form) => {
  let totalScore = 0;
  let maxScore = 0;

  form.questions.forEach(question => {
    maxScore += question.points;
    const userAnswer = answers[question.id];
    
    if (!userAnswer) return;

    switch (question.type) {
      case 'categorize':
        const correctMap = question.data.correctMap;
        const userMap = userAnswer;
        let correctCount = 0;
        const totalItems = Object.keys(correctMap).length;
        
        Object.keys(correctMap).forEach(item => {
          if (userMap[item] === correctMap[item]) {
            correctCount++;
          }
        });
        
        totalScore += (correctCount / totalItems) * question.points;
        break;

      case 'cloze':
        const correctAnswers = question.data.answers;
        const userClozeAnswers = userAnswer;
        let correctBlanks = 0;
        
        correctAnswers.forEach((correct, index) => {
          if (userClozeAnswers[index]?.toLowerCase() === correct.toLowerCase()) {
            correctBlanks++;
          }
        });
        
        totalScore += (correctBlanks / correctAnswers.length) * question.points;
        break;

      case 'comprehension':
        let correctQuestions = 0;
        const totalQuestions = question.data.questions.length;
        
        // Handle both array and object formats for backward compatibility
        let userComprehensionAnswers = [];
        if (Array.isArray(userAnswer)) {
          userComprehensionAnswers = userAnswer;
        } else if (userAnswer && typeof userAnswer === 'object') {
          // Convert object format {0: 1, 1: 2} to array format [1, 2]
          userComprehensionAnswers = [];
          question.data.questions.forEach((_, index) => {
            userComprehensionAnswers[index] = userAnswer[index];
          });
        }
        
        question.data.questions.forEach((q, index) => {
          if (typeof userComprehensionAnswers[index] === 'number' && userComprehensionAnswers[index] === q.correct) {
            correctQuestions++;
          }
        });
        
        totalScore += (correctQuestions / totalQuestions) * question.points;
        break;
    }
  });

  return {
    score: Math.round(totalScore * 100) / 100,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100)
  };
};
