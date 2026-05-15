const { nanoid } = require('nanoid');
const Poll = require('../models/Poll');
const Response = require('../models/Response');
const User = require('../models/User');
const pollService = require('../services/pollService');

const syncPollStatus = async (poll) => {
  if (poll.status === 'active' && new Date() > poll.expiresAt) {
    poll.status = 'expired';
    await poll.save();
  }
  return poll;
};

// Zod middleware validates before this runs — no validationResult needed
exports.createPoll = async (req, res, next) => {
  try {
    const { title, description, questions, isAnonymous, expiresAt, settings } = req.body;
    const poll = await Poll.create({
      title, description, creator: req.user._id, questions,
      isAnonymous: isAnonymous !== undefined ? isAnonymous : true,
      expiresAt: new Date(expiresAt),
      shareCode: nanoid(10),
      settings: settings || {},
    });
    await User.findByIdAndUpdate(req.user._id, { $inc: { pollsCreated: 1 } });
    res.status(201).json({ success: true, poll });
  } catch (err) { next(err); }
};

exports.getMyPolls = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { creator: req.user._id };
    if (status) query.status = status;
    await Poll.updateMany(
      { creator: req.user._id, status: 'active', expiresAt: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );
    const total = await Poll.countDocuments(query);
    const polls = await Poll.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({
      success: true, polls,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

exports.getPollById = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, creator: req.user._id })
      .populate('creator', 'name email');
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });
    await syncPollStatus(poll);
    res.json({ success: true, poll });
  } catch (err) { next(err); }
};

exports.getPollByShareCode = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ shareCode: req.params.shareCode }).populate('creator', 'name');
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });
    await syncPollStatus(poll);

    if (poll.status === 'published' || poll.isResultPublished) {
      const pollObj = poll.toObject();
      pollObj.questions = pollObj.questions.map((q) => {
        const total = q.options.reduce((s, o) => s + (o.count || 0), 0);
        return {
          ...q,
          totalAnswers: total,
          options: q.options.map((o) => ({
            ...o,
            percentage: total > 0 ? Math.round(((o.count || 0) / total) * 100) : 0,
          })),
        };
      });
      return res.json({ success: true, poll: pollObj, isPublished: true });
    }

    if (poll.status === 'expired') {
      const s = poll.toObject();
      s.questions = s.questions.map((q) => ({
        ...q, options: q.options.map((o) => ({ _id: o._id, text: o.text })),
      }));
      return res.json({ success: true, poll: s, status: 'expired' });
    }

    const sanitized = poll.toObject();
    sanitized.questions = sanitized.questions.map((q) => ({
      ...q, options: q.options.map((o) => ({ _id: o._id, text: o.text })),
    }));

    let alreadyResponded = false;
    if (req.user) {
      const existing = await Response.findOne({ poll: poll._id, respondent: req.user._id });
      if (existing) alreadyResponded = true;
    }
    res.json({ success: true, poll: sanitized, alreadyResponded });
  } catch (err) { next(err); }
};

exports.updatePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, creator: req.user._id });
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });
    if (poll.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active polls can be edited.' });
    }
    ['title', 'description', 'expiresAt', 'settings'].forEach((f) => {
      if (req.body[f] !== undefined) poll[f] = req.body[f];
    });
    await poll.save();
    res.json({ success: true, poll });
  } catch (err) { next(err); }
};

exports.deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findOneAndDelete({ _id: req.params.id, creator: req.user._id });
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });
    await Response.deleteMany({ poll: req.params.id });
    await User.findByIdAndUpdate(req.user._id, { $inc: { pollsCreated: -1 } });
    res.json({ success: true, message: 'Poll deleted successfully.' });
  } catch (err) { next(err); }
};

exports.publishResults = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, creator: req.user._id });
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });
    if (poll.status === 'active') {
      return res.status(400).json({ success: false, message: 'Close the poll before publishing.' });
    }
    if (poll.isResultPublished) {
      return res.status(400).json({ success: false, message: 'Results already published.' });
    }
    poll.isResultPublished = true;
    poll.status = 'published';
    poll.publishedAt = new Date();
    await poll.save();
    const io = req.app.get('io');
    if (io) {
      const payload = { pollId: poll._id, shareCode: poll.shareCode };
      io.to(`poll:${poll.shareCode}`).emit('poll:published', payload);
      io.to(`poll:admin:${poll.shareCode}`).emit('poll:published', payload);
    }
    res.json({ success: true, poll, message: 'Results published successfully!' });
  } catch (err) { next(err); }
};

// Thin controller — delegates all DB work to pollService
exports.getPollAnalytics = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, creator: req.user._id });
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });

    const analytics = await pollService.getAnalytics(poll._id);
    if (!analytics) return res.status(404).json({ success: false, message: 'Analytics not found.' });

    res.json({ success: true, analytics });
  } catch (err) { next(err); }
};

exports.closePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, creator: req.user._id });
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });
    if (poll.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Poll is not active.' });
    }
    poll.status = 'expired';
    poll.expiresAt = new Date();
    await poll.save();
    const io = req.app.get('io');
    if (io) {
      const payload = { pollId: poll._id, shareCode: poll.shareCode };
      io.to(`poll:${poll.shareCode}`).emit('poll:expired', payload);
      io.to(`poll:admin:${poll.shareCode}`).emit('poll:expired', payload);
    }
    res.json({ success: true, poll, message: 'Poll closed successfully.' });
  } catch (err) { next(err); }
};

// Thin controller — delegates to pollService
exports.getDashboardStats = async (req, res, next) => {
  try {
    const result = await pollService.getDashboardStats(req.user._id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.duplicatePoll = async (req, res, next) => {
  try {
    const original = await Poll.findOne({ _id: req.params.id, creator: req.user._id });
    if (!original) return res.status(404).json({ success: false, message: 'Poll not found.' });
    const { expiresInHours = 24 } = req.body;
    const newPoll = await Poll.create({
      title: `${original.title} (Copy)`,
      description: original.description,
      creator: req.user._id,
      questions: original.questions.map((q) => ({
        text: q.text, isMandatory: q.isMandatory, order: q.order,
        options: q.options.map((o) => ({ text: o.text, count: 0 })),
      })),
      isAnonymous: original.isAnonymous,
      expiresAt: new Date(Date.now() + Number(expiresInHours) * 3600000),
      shareCode: nanoid(10),
      settings: original.settings,
      status: 'active',
    });
    await User.findByIdAndUpdate(req.user._id, { $inc: { pollsCreated: 1 } });
    res.status(201).json({ success: true, poll: newPoll, message: 'Poll duplicated successfully!' });
  } catch (err) { next(err); }
};

exports.exportCsv = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, creator: req.user._id });
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });
    const responses = await Response.find({ poll: poll._id })
      .populate('respondent', 'name email').sort({ submittedAt: 1 });

    const questionHeaders = poll.questions.map((q) => `"${q.text.replace(/"/g, '""')}"`);
    const headers = ['Response #', 'Respondent', 'Anonymous', 'Submitted At', 'Completion Time (s)', ...questionHeaders];

    const rows = responses.map((r, idx) => {
      const name = r.isAnonymous ? 'Anonymous' : (r.respondent?.name || r.respondentName || 'Unknown');
      const answerCells = poll.questions.map((q) => {
        const ans = r.answers.find((a) => a.questionId.toString() === q._id.toString());
        if (!ans) return '""';
        const opt = q.options.id(ans.selectedOptionId);
        return opt ? `"${opt.text.replace(/"/g, '""')}"` : '"(deleted)"';
      });
      return [idx + 1, `"${name}"`, r.isAnonymous, `"${r.submittedAt.toISOString()}"`, r.completionTime || '', ...answerCells].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pollify-${poll.shareCode}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
};

exports.getEmbedCode = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, creator: req.user._id })
      .select('title shareCode status');
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const pollUrl = `${baseUrl}/poll/${poll.shareCode}`;
    const embedCode = `<iframe src="${pollUrl}" width="100%" height="600" frameborder="0" style="border:none;border-radius:12px;max-width:640px;" title="${poll.title.replace(/"/g, '&quot;')}" allow="clipboard-write"></iframe>`;
    res.json({ success: true, embedCode, pollUrl, shareCode: poll.shareCode });
  } catch (err) { next(err); }
};

// exports.checkMilestone = (totalResponses) => {
//   return [10, 25, 50, 100, 250, 500].find((m) => m === totalResponses) || null;
// };