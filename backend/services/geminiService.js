const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateDistractors = async (text, correctAnswers) => {
  try {
    // Use the correct model name
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Given this text: "${text}" and these correct answers: ${correctAnswers.join(', ')}, 
    generate 3 plausible but incorrect alternative answers for each blank. 
    The distractors should be similar in length and style to the correct answers but clearly wrong.
    Return as JSON array: [["distractor1", "distractor2", "distractor3"], ...]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Parse JSON response
    const jsonMatch = textResponse.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: generate simple distractors
    return correctAnswers.map(answer => [
      answer + 's',
      answer.slice(0, -1),
      'incorrect'
    ]);
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback distractors
    return correctAnswers.map(answer => [
      answer + 's',
      answer.slice(0, -1),
      'incorrect'
    ]);
  }
};

const generateQuestionSuggestions = async (questionText) => {
  try {
    // Use the correct model name
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Rephrase this question in 3 different ways while keeping the same meaning: "${questionText}"
    Return as JSON array of strings.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    const jsonMatch = textResponse.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [questionText];
  } catch (error) {
    console.error('Gemini API error:', error);
    return [questionText];
  }
};

module.exports = {
  generateDistractors,
  generateQuestionSuggestions
};
