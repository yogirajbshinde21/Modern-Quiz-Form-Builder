const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Generate HTML email template for results
const generateResultsEmailHTML = (response, form) => {
  const percentage = response.maxScore > 0 ? Math.round((response.score / response.maxScore) * 100) : 0;
  const performanceColor = percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444';
  const performanceText = percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!';

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const renderQuestionAnalysis = (question, userAnswer) => {
    if (question.type === 'categorize') {
      const correctMap = question.data.correctMap;
      let html = `
        <div style="margin: 20px 0;">
          <h4 style="color: #374151; margin-bottom: 15px;">Your Item Placements</h4>
          <div style="display: grid; gap: 15px;">
      `;
      
      Object.keys(correctMap).forEach(item => {
        const userCategory = userAnswer?.[item];
        const correctCategory = correctMap[item];
        const isCorrect = userCategory === correctCategory;
        const bgColor = isCorrect ? '#ECFDF5' : '#FEF2F2';
        const borderColor = isCorrect ? '#10B981' : '#EF4444';
        const textColor = isCorrect ? '#065F46' : '#B91C1C';
        
        html += `
          <div style="padding: 15px; border: 2px solid ${borderColor}; border-radius: 8px; background-color: ${bgColor};">
            <div style="font-weight: 600; color: #111827; margin-bottom: 8px;">${item}</div>
            <div style="color: ${textColor};">
              <strong>Your answer:</strong> ${userCategory || 'Not answered'} ${isCorrect ? '✓' : '✗'}
              ${!isCorrect ? `<br><span style="color: #065F46;"><strong>Correct answer:</strong> ${correctCategory}</span>` : ''}
            </div>
          </div>
        `;
      });
      
      html += `</div></div>`;
      return html;
    }
    
    if (question.type === 'cloze') {
      const correctAnswers = question.data.answers || [];
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
      
      let html = `
        <div style="margin: 20px 0;">
          <h4 style="color: #374151; margin-bottom: 15px;">Your Fill-in-the-Blanks</h4>
          <div style="display: grid; gap: 12px;">
      `;
      
      correctAnswers.forEach((correctAnswer, index) => {
        const userBlankAnswer = userAnswers[index];
        const isCorrect = userBlankAnswer === correctAnswer;
        const bgColor = isCorrect ? '#ECFDF5' : '#FEF2F2';
        const borderColor = isCorrect ? '#10B981' : '#EF4444';
        const textColor = isCorrect ? '#065F46' : '#B91C1C';
        
        html += `
          <div style="padding: 15px; border: 2px solid ${borderColor}; border-radius: 8px; background-color: ${bgColor};">
            <div style="font-weight: 600; color: #111827; margin-bottom: 8px;">Blank ${index + 1}</div>
            <div style="color: ${textColor};">
              <strong>Your answer:</strong> <span style="background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #D1D5DB;">${userBlankAnswer || 'Empty'}</span> ${isCorrect ? '✓' : '✗'}
              ${!isCorrect ? `<br><span style="color: #065F46;"><strong>Correct answer:</strong> <span style="background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #D1D5DB;">${correctAnswer}</span></span>` : ''}
            </div>
          </div>
        `;
      });
      
      html += `</div></div>`;
      return html;
    }
    
    if (question.type === 'comprehension') {
      let userAnswers = [];
      
      // Handle both array and object formats for backward compatibility
      if (Array.isArray(userAnswer)) {
        userAnswers = userAnswer;
      } else if (userAnswer && typeof userAnswer === 'object') {
        // Convert object format {0: 1, 1: 2} to array format [1, 2]
        userAnswers = [];
        question.data.questions.forEach((_, index) => {
          userAnswers[index] = userAnswer[index];
        });
      }
      
      let html = `
        <div style="margin: 20px 0;">
          <h4 style="color: #374151; margin-bottom: 15px;">Your Multiple Choice Answers</h4>
          <div style="display: grid; gap: 12px;">
      `;
      
      question.data.questions.forEach((q, qIndex) => {
        const userChoice = userAnswers[qIndex];
        const correctChoice = q.correct;
        const isCorrect = userChoice === correctChoice;
        const bgColor = isCorrect ? '#ECFDF5' : '#FEF2F2';
        const borderColor = isCorrect ? '#10B981' : '#EF4444';
        const textColor = isCorrect ? '#065F46' : '#B91C1C';
        
        html += `
          <div style="padding: 15px; border: 2px solid ${borderColor}; border-radius: 8px; background-color: ${bgColor};">
            <div style="font-weight: 600; color: #111827; margin-bottom: 10px;">${q.question}</div>
            <div style="color: ${textColor};">
              <strong>Your answer:</strong> ${typeof userChoice === 'number' ? 
                `${String.fromCharCode(65 + userChoice)}. ${q.choices[userChoice]}` : 
                'Not answered'} ${isCorrect ? '✓' : '✗'}
              ${!isCorrect ? `<br><span style="color: #065F46;"><strong>Correct answer:</strong> ${String.fromCharCode(65 + correctChoice)}. ${q.choices[correctChoice]}</span>` : ''}
            </div>
          </div>
        `;
      });
      
      html += `</div></div>`;
      return html;
    }
    
    return '';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Form Results</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Your Form Results</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${form.title}</p>
        </div>

        <!-- Score Overview -->
        <div style="padding: 40px 30px; text-align: center; background-color: #F8FAFC; border-bottom: 1px solid #E5E7EB;">
          <div style="font-size: 48px; font-weight: bold; color: ${performanceColor}; margin-bottom: 10px;">
            ${percentage}%
          </div>
          <div style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 10px;">
            ${response.score} out of ${response.maxScore} points
          </div>
          <div style="font-size: 16px; font-weight: 600; color: ${performanceColor};">
            ${performanceText}
          </div>
          
          <!-- Stats Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 20px; margin-top: 30px;">
            <div style="text-align: center;">
              <div style="font-size: 14px; color: #6B7280; margin-bottom: 5px;">Submitted by</div>
              <div style="font-weight: 600; color: #111827;">${response.submitterName}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 14px; color: #6B7280; margin-bottom: 5px;">Email</div>
              <div style="font-weight: 600; color: #111827;">${response.submitterEmail}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 14px; color: #6B7280; margin-bottom: 5px;">Time Spent</div>
              <div style="font-weight: 600; color: #111827;">${formatTime(response.timeSpent)}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 14px; color: #6B7280; margin-bottom: 5px;">Submitted At</div>
              <div style="font-weight: 600; color: #111827;">${new Date(response.submittedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <!-- Detailed Results -->
        <div style="padding: 30px;">
          <h2 style="color: #111827; margin-bottom: 25px; font-size: 20px;">Detailed Analysis</h2>
          
          ${form.questions.map((question, index) => {
            const userAnswer = response.answers[question.id];
            const timeSpent = response.questionTimes && response.questionTimes[question.id] 
              ? formatTime(response.questionTimes[question.id]) 
              : 'Not tracked';
            
            return `
              <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; background-color: #FAFAFA;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                  <div>
                    <h3 style="color: #111827; margin: 0 0 5px 0; font-size: 16px;">Q${index + 1}: ${question.title}</h3>
                    <span style="color: #6B7280; font-size: 12px; text-transform: capitalize; background: #E5E7EB; padding: 2px 8px; border-radius: 12px;">${question.type}</span>
                  </div>
                  ${timeSpent !== 'Not tracked' ? `
                    <div style="text-align: right;">
                      <span style="color: #F59E0B; font-size: 12px;">⏱️ ${timeSpent}</span>
                    </div>
                  ` : ''}
                </div>
                
                ${question.type === 'comprehension' ? `
                  <div style="margin-bottom: 15px; padding: 15px; background-color: #F3F4F6; border-radius: 6px;">
                    <p style="color: #111827; line-height: 1.6; margin: 0;">${question.data.passage}</p>
                  </div>
                ` : ''}
                
                ${renderQuestionAnalysis(question, userAnswer)}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Footer -->
        <div style="background-color: #F3F4F6; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; margin: 0; font-size: 14px;">
            Thank you for taking our form! Keep learning and improving.
          </p>
          <p style="color: #9CA3AF; margin: 10px 0 0 0; font-size: 12px;">
            This email was automatically generated by Form Builder System.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send results email
const sendResultsEmail = async (to, response, form) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = generateResultsEmailHTML(response, form);
    const percentage = response.maxScore > 0 ? Math.round((response.score / response.maxScore) * 100) : 0;
    
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Form Builder System',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER
      },
      to: to,
      subject: `Your Results for "${form.title}" - ${percentage}% Score`,
      html: htmlContent,
      text: `Your results for "${form.title}": ${response.score}/${response.maxScore} points (${percentage}%)`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Results email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending results email:', error);
    throw error;
  }
};

// Email configuration validation
const validateEmailConfig = () => {
  const required = ['EMAIL_USER', 'EMAIL_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Email service disabled. Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

module.exports = {
  sendResultsEmail,
  validateEmailConfig
};
