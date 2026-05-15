const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Option text cannot exceed 200 characters'],
  },
  count: { type: Number, default: 0 },
});

const questionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Question text cannot exceed 500 characters'],
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: (arr) => arr.length >= 2 && arr.length <= 10,
      message: 'Each question must have between 2 and 10 options',
    },
  },
  isMandatory: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
});

const pollSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Poll title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shareCode: {
      type: String,
      unique: true,
      required: true,
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 20,
        message: 'Poll must have between 1 and 20 questions',
      },
    },
    isAnonymous: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'expired', 'published'],
      default: 'active',
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry time is required'],
    },
    totalResponses: { type: Number, default: 0 },
    isResultPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    settings: {
      allowMultipleSubmissions: { type: Boolean, default: false },
      showProgressBar: { type: Boolean, default: true },
      randomizeQuestions: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-expire poll if past expiresAt
pollSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiresAt;
});

// Pre-save: check expiry
pollSchema.pre('save', function (next) {
  if (this.expiresAt && new Date() > this.expiresAt && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Indexes
pollSchema.index({ creator: 1 });
pollSchema.index({ status: 1 });
pollSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Poll', pollSchema);