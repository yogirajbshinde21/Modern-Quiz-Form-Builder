const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Form = require('../models/Form');
const Response = require('../models/Response');
const { generateDistractors } = require('../services/geminiService');
const { sendResultsEmail, validateEmailConfig } = require('../services/emailService');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId, processFormImages } = require('../services/cloudinaryService');

const router = express.Router();

// Helper function to extract all Cloudinary URLs from a form
const extractCloudinaryUrls = (form) => {
  const urls = [];
  
  // Check header image
  if (form.headerImage && form.headerImage.includes('cloudinary.com')) {
    urls.push({
      type: 'header',
      url: form.headerImage
    });
  }
  
  // Check questions for images
  if (form.questions && Array.isArray(form.questions)) {
    form.questions.forEach((question, questionIndex) => {
      // Check question image
      if (question.image && question.image.includes('cloudinary.com')) {
        urls.push({
          type: 'question',
          questionIndex,
          questionId: question.id,
          questionText: question.text ? question.text.substring(0, 50) + '...' : 'No text',
          url: question.image
        });
      }
      
      // Check comprehension passage image
      if (question.type === 'comprehension' && question.data?.passage?.image && 
          question.data.passage.image.includes('cloudinary.com')) {
        urls.push({
          type: 'comprehension_passage',
          questionIndex,
          questionId: question.id,
          url: question.data.passage.image
        });
      }
      
      // Check categorize question images
      if (question.type === 'categorize' && question.data?.items) {
        question.data.items.forEach((item, itemIndex) => {
          if (item.image && item.image.includes('cloudinary.com')) {
            urls.push({
              type: 'categorize_item',
              questionIndex,
              questionId: question.id,
              itemIndex,
              itemText: item.text || `Item ${itemIndex}`,
              url: item.image
            });
          }
        });
      }
    });
  }
  
  return urls;
};

// Configure multer for temporary image uploads (before Cloudinary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'temp-uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create new form
router.post('/', async (req, res) => {
  try {
    // Process images and upload to Cloudinary if needed
    const processedFormData = await processFormImages(req.body);
    
    const form = new Form(processedFormData);
    await form.save();
    
    // Log all Cloudinary URLs in the form
    const cloudinaryUrls = extractCloudinaryUrls(form);
    if (cloudinaryUrls.length > 0) {
      console.log('\n🖼️  FORM CREATED - Cloudinary Images Found:');
      console.log(`📝 Form: "${form.title}" (ID: ${form._id})`);
      console.log(`📊 Total Images: ${cloudinaryUrls.length}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      cloudinaryUrls.forEach((item, index) => {
        console.log(`${index + 1}. ${item.type.toUpperCase().replace('_', ' ')}`);
        if (item.questionText) {
          console.log(`   📋 Question: ${item.questionText}`);
        }
        if (item.itemText) {
          console.log(`   🏷️  Item: ${item.itemText}`);
        }
        console.log(`   🔗 URL: ${item.url}`);
        console.log('');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log(`📝 Form created: "${form.title}" (ID: ${form._id}) - No Cloudinary images found`);
    }
    
    res.status(201).json(form);
  } catch (error) {
    console.error('❌ Error creating form:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all forms
router.get('/', async (req, res) => {
  try {
    const forms = await Form.find().sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific form
router.get('/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update form
router.put('/:id', async (req, res) => {
  try {
    // Process images and upload to Cloudinary if needed
    const processedFormData = await processFormImages(req.body);
    
    const form = await Form.findByIdAndUpdate(req.params.id, processedFormData, { new: true });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Log all Cloudinary URLs in the updated form
    const cloudinaryUrls = extractCloudinaryUrls(form);
    if (cloudinaryUrls.length > 0) {
      console.log('\n🔄 FORM UPDATED - Cloudinary Images Found:');
      console.log(`📝 Form: "${form.title}" (ID: ${form._id})`);
      console.log(`📊 Total Images: ${cloudinaryUrls.length}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      cloudinaryUrls.forEach((item, index) => {
        console.log(`${index + 1}. ${item.type.toUpperCase().replace('_', ' ')}`);
        if (item.questionText) {
          console.log(`   📋 Question: ${item.questionText}`);
        }
        if (item.itemText) {
          console.log(`   🏷️  Item: ${item.itemText}`);
        }
        console.log(`   🔗 URL: ${item.url}`);
        console.log('');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log(`📝 Form updated: "${form.title}" (ID: ${form._id}) - No Cloudinary images found`);
    }
    
    res.json(form);
  } catch (error) {
    console.error('❌ Error updating form:', error);
    res.status(400).json({ error: error.message });
  }
});

// Upload image to Cloudinary
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path, 'form-builder');
    
    // Delete temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    res.json({ 
      filename: req.file.filename,
      url: cloudinaryResult.url,
      cloudinary: {
        public_id: cloudinaryResult.public_id,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        bytes: cloudinaryResult.bytes
      }
    });
  } catch (error) {
    // Delete temporary file in case of error
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
    
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Submit form response
router.post('/:id/responses', async (req, res) => {
  try {
    console.log('Submitting response for form:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const form = await Form.findById(req.params.id);
    if (!form) {
      console.log('Form not found:', req.params.id);
      return res.status(404).json({ error: 'Form not found' });
    }

    // Validate required fields
    if (!req.body.submitterName || !req.body.submitterEmail) {
      console.log('Missing required fields:', { 
        name: req.body.submitterName, 
        email: req.body.submitterEmail 
      });
      return res.status(400).json({ error: 'Submitter name and email are required' });
    }

    if (!req.body.answers) {
      console.log('No answers provided');
      return res.status(400).json({ error: 'Answers are required' });
    }

    console.log('Form questions:', form.questions.length);
    console.log('Provided answers:', Object.keys(req.body.answers).length);

    // Calculate score
    let score = 0;
    let maxScore = 0;
    
    form.questions.forEach(question => {
      maxScore += question.points || 1;
      const userAnswer = req.body.answers[question.id];
      
      if (!userAnswer) {
        console.log(`No answer for question ${question.id}`);
        return; // Skip if no answer provided
      }

      try {
        if (question.type === 'categorize') {
          const correctMap = question.data?.correctMap;
          if (!correctMap) {
            console.log(`No correctMap for categorize question ${question.id}`);
            return;
          }
          
          const userMap = userAnswer;
          let correctCount = 0;
          const totalItems = Object.keys(correctMap).length;
          
          if (totalItems > 0) {
            Object.keys(correctMap).forEach(item => {
              if (userMap && userMap[item] === correctMap[item]) {
                correctCount++;
              }
            });
            score += (correctCount / totalItems) * (question.points || 1);
          }
        } else if (question.type === 'cloze') {
          const correctAnswers = question.data?.answers;
          if (!correctAnswers || !Array.isArray(correctAnswers)) {
            console.log(`No correct answers for cloze question ${question.id}`);
            return;
          }
          
          const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
          let correctCount = 0;
          
          correctAnswers.forEach((correct, index) => {
            if (userAnswers[index] && 
                userAnswers[index].toLowerCase().trim() === correct.toLowerCase().trim()) {
              correctCount++;
            }
          });
          
          if (correctAnswers.length > 0) {
            score += (correctCount / correctAnswers.length) * (question.points || 1);
          }
        } else if (question.type === 'comprehension') {
          const questions = question.data?.questions;
          if (!questions || !Array.isArray(questions)) {
            console.log(`No questions for comprehension question ${question.id}`);
            return;
          }
          
          let correctCount = 0;
          let userAnswers = [];
          
          // Handle both array and object formats for backward compatibility
          if (Array.isArray(userAnswer)) {
            userAnswers = userAnswer;
          } else if (userAnswer && typeof userAnswer === 'object') {
            // Convert object format {0: 1, 1: 2} to array format [1, 2]
            userAnswers = [];
            questions.forEach((_, index) => {
              userAnswers[index] = userAnswer[index];
            });
          }
          
          questions.forEach((q, index) => {
            if (typeof userAnswers[index] === 'number' && userAnswers[index] === q.correct) {
              correctCount++;
            }
          });
          
          if (questions.length > 0) {
            score += (correctCount / questions.length) * (question.points || 1);
          }
        }
      } catch (questionError) {
        console.error(`Error scoring question ${question.id}:`, questionError);
      }
    });

    const response = new Response({
      formId: req.params.id,
      answers: req.body.answers,
      score: Math.round(score * 100) / 100,
      maxScore,
      submitterEmail: req.body.submitterEmail,
      submitterName: req.body.submitterName,
      timeSpent: req.body.timeSpent || 0,
      questionTimes: req.body.questionTimes || {}
    });

    console.log('Saving response:', response);
    await response.save();

    // Send results email to user
    try {
      if (validateEmailConfig()) {
        await sendResultsEmail(response.submitterEmail, response, form);
        console.log(`Results email sent to ${response.submitterEmail}`);
      } else {
        console.log('Email service not configured, skipping email notification');
      }
    } catch (emailError) {
      console.error('Failed to send results email:', emailError);
      // Don't fail the form submission if email fails
    }
    
    res.status(201).json({
      _id: response._id,
      score: response.score,
      maxScore: response.maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      submittedAt: response.submittedAt
    });
  } catch (error) {
    console.error('Response submission error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all responses (for global analytics) - must come before /:id/responses
router.get('/responses/all', async (req, res) => {
  try {
    const responses = await Response.find()
      .populate('formId', 'title')
      .sort({ submittedAt: -1 });
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get form responses
router.get('/:id/responses', async (req, res) => {
  try {
    const responses = await Response.find({ formId: req.params.id })
      .sort({ submittedAt: -1 });
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete form
router.delete('/:id', async (req, res) => {
  try {
    const form = await Form.findByIdAndDelete(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Also delete all responses for this form
    await Response.deleteMany({ formId: req.params.id });
    
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate distractors for cloze questions
router.post('/generate-distractors', async (req, res) => {
  try {
    const { text, correctAnswers } = req.body;
    const distractors = await generateDistractors(text, correctAnswers);
    res.json({ distractors });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate distractors' });
  }
});

module.exports = router;
