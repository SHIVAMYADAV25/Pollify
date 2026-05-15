const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

const responseSchema = new mongoose.Schema(
  {
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
    },
    respondent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isAnonymous: { type: Boolean, default: true },
    respondentName: { type: String, default: 'Anonymous' },
    answers: {
      type: [answerSchema],
      required: true,
    },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    submittedAt: { type: Date, default: Date.now },
    completionTime: { type: Number, default: null }, // seconds
  },
  {
    timestamps: true,
  }
);

responseSchema.index({ poll: 1, respondent: 1 });
responseSchema.index({ poll: 1, ipAddress: 1 });
responseSchema.index({ poll: 1, submittedAt: -1 });

module.exports = mongoose.model('Response', responseSchema);