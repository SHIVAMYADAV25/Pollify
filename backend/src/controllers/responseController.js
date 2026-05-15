const Poll = require('../models/Poll');
const Response = require('../models/Response');
const pollService = require('../services/pollService');

exports.submitResponse = async (req, res, next) => {
  try {
    const { shareCode } = req.params;
    const { answers, completionTime } = req.body;

    const poll = await Poll.findOne({ shareCode });
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });

    // Expiry check
    if (poll.status !== 'active' || new Date() > poll.expiresAt) {
      poll.status = 'expired';
      await poll.save();
      return res.status(410).json({ success: false, message: 'This poll has expired and is no longer accepting responses.' });
    }

    // Auth check for non-anonymous polls
    if (!poll.isAnonymous && !req.user) {
      return res.status(401).json({ success: false, message: 'This poll requires authentication. Please log in to respond.' });
    }

    // Duplicate check — authenticated user
    if (req.user && !poll.settings?.allowMultipleSubmissions) {
      const existing = await Response.findOne({ poll: poll._id, respondent: req.user._id });
      if (existing) {
        return res.status(409).json({ success: false, message: 'You have already submitted a response to this poll.' });
      }
    }

    // Duplicate check — anonymous user by IP
    if (!req.user && !poll.settings?.allowMultipleSubmissions) {
      const rawIp = req.ip || req.connection?.remoteAddress || '';
const ip = rawIp.replace('::ffff:', '');
      const existing = await Response.findOne({ poll: poll._id, ipAddress: ip, isAnonymous: true });
      if (existing) {
        return res.status(409).json({ success: false, message: 'A response from your location has already been submitted.' });
      }
    }

    // Validate all mandatory questions are answered
    const mandatoryQuestions = poll.questions.filter((q) => q.isMandatory);
    const answeredIds = (answers || []).map((a) => a.questionId?.toString());
    for (const mq of mandatoryQuestions) {
      if (!answeredIds.includes(mq._id.toString())) {
        return res.status(400).json({ success: false, message: `Question "${mq.text}" is mandatory and must be answered.` });
      }
    }

    // Validate each answer references a real question and option
    const validatedAnswers = [];
    for (const ans of answers || []) {
      const question = poll.questions.id(ans.questionId);
      if (!question) continue;
      const option = question.options.id(ans.selectedOptionId);
      if (!option) {
        return res.status(400).json({ success: false, message: `Invalid option selected for question "${question.text}".` });
      }
      validatedAnswers.push({ questionId: ans.questionId, selectedOptionId: ans.selectedOptionId });
    }

    const rawIp = req.ip || req.connection?.remoteAddress || '';
    const ip = rawIp.replace('::ffff:', '');

    // Delegate atomic transaction to service layer
    const { updatedPoll, milestone } = await pollService.submitResponse({
      poll,
      answers: validatedAnswers,
      completionTime,
      userId: req.user?._id || null,
      respondentName: req.user ? req.user.name : 'Anonymous',
      ip,
      userAgent: req.headers['user-agent'],
    });

    // Real-time events after successful transaction
    const io = req.app.get('io');
    if (io && updatedPoll) {
      const analyticsPayload = {
        totalResponses: updatedPoll.totalResponses,
        pollId: updatedPoll._id,
        shareCode: updatedPoll.shareCode,
      };
      io.to(`poll:${shareCode}`).emit('response:new', analyticsPayload);
      io.to(`creator:${updatedPoll.creator.toString()}`).emit('response:new', analyticsPayload);
      io.to(`poll:admin:${shareCode}`).emit('response:new', analyticsPayload);

      if (milestone) {
        io.to(`creator:${updatedPoll.creator.toString()}`).emit('milestone:reached', {
          milestone,
          pollId: updatedPoll._id,
          pollTitle: poll.title,
          shareCode: updatedPoll.shareCode,
        });
      }
    }

    res.status(201).json({ success: true, message: 'Response submitted successfully!' });
  } catch (err) {
    next(err);
  }
};

exports.getMyResponses = async (req, res, next) => {
  try {
    const responses = await Response.find({ respondent: req.user._id })
      .populate('poll', 'title shareCode status')
      .sort({ submittedAt: -1 })
      .limit(20);
    res.json({ success: true, responses });
  } catch (err) {
    next(err);
  }
};