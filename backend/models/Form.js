const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: String,
  type: {
    type: String,
    enum: ['categorize', 'cloze', 'comprehension'],
    required: true
  },
  title: String,
  image: String,
  points: { type: Number, default: 1 },
  feedback: String,
  data: mongoose.Schema.Types.Mixed // Flexible data structure for different question types
});

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  headerImage: String,
  questions: [questionSchema],
  isPublished: { type: Boolean, default: false },
  createdBy: String,
  settings: {
    allowMultipleSubmissions: { type: Boolean, default: false },
    showCorrectAnswers: { type: Boolean, default: true },
    timeLimit: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Form', formSchema);
