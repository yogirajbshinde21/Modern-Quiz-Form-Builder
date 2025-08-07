const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  formId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Form', 
    required: true 
  },
  answers: mongoose.Schema.Types.Mixed,
  score: Number,
  maxScore: Number,
  submittedAt: { type: Date, default: Date.now },
  submitterEmail: String,
  submitterName: String,
  timeSpent: Number, // in seconds - total time spent on form
  questionTimes: mongoose.Schema.Types.Mixed // object with questionId as key and time spent in seconds as value
});

module.exports = mongoose.model('Response', responseSchema);
