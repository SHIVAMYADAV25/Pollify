const mongoose = require('mongoose');
const Poll = require('../models/Poll');
const Response = require('../models/Response');
const User = require('../models/User');
const { checkMilestone } = require('../utils/milestones');

// ─── Analytics ────────────────────────────────────────────────────────────────
// All metrics via MongoDB $aggregate + $facet — zero in-memory math.
exports.getAnalytics = async (pollId) => {
  const poll = await Poll.findById(pollId);
  if (!poll) return null;

  const pollObjectId = new mongoose.Types.ObjectId(poll._id);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const mandatoryQCount = poll.questions.filter((q) => q.isMandatory).length;

  const [agg] = await Response.aggregate([
    { $match: { poll: pollObjectId } },
    {
      $facet: {
        // Total count, anon split, avg completion time
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              anonymousCount: { $sum: { $cond: ['$isAnonymous', 1, 0] } },
              avgCompletionTime: { $avg: '$completionTime' },
            },
          },
        ],
        // Per-option vote counts from unwound answers
        optionCounts: [
          { $unwind: '$answers' },
          {
            $group: {
              _id: {
                questionId: '$answers.questionId',
                optionId: '$answers.selectedOptionId',
              },
              count: { $sum: 1 },
            },
          },
        ],
        // Daily response counts for the last 7 days
        dailyParticipation: [
          { $match: { submittedAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        // 10 most recent responses
        recentResponses: [
          { $sort: { submittedAt: -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 1,
              respondentName: 1,
              isAnonymous: 1,
              submittedAt: 1,
              completionTime: 1,
              answerCount: { $size: '$answers' },
            },
          },
        ],
        // Completion rate fully inside pipeline — no in-memory filter
        completionStats: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completedCount: {
                $sum: {
                  $cond: [{ $gte: [{ $size: '$answers' }, mandatoryQCount] }, 1, 0],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              total: 1,
              completedCount: 1,
              completionRate: {
                $multiply: [
                  { $divide: ['$completedCount', { $max: ['$total', 1] }] },
                  100,
                ],
              },
            },
          },
        ],
      },
    },
  ]);

  // Build option count lookup from aggregated result
  const optionCountMap = {};
  (agg.optionCounts || []).forEach(({ _id, count }) => {
    optionCountMap[`${_id.questionId}_${_id.optionId}`] = count;
  });

  const totalResponses = agg.totals[0]?.total || 0;

  const questionSummary = poll.questions.map((q) => {
    const optionsWithCounts = q.options.map((o) => ({
      optionId: o._id,
      text: o.text,
      count: optionCountMap[`${q._id}_${o._id}`] || 0,
    }));
    const totalAnswers = optionsWithCounts.reduce((s, o) => s + o.count, 0);
    return {
      questionId: q._id,
      questionText: q.text,
      isMandatory: q.isMandatory,
      totalAnswers,
      options: optionsWithCounts.map((o) => ({
        ...o,
        percentage: totalAnswers > 0 ? Math.round((o.count / totalAnswers) * 100) : 0,
      })),
    };
  });

  const completionRate = Math.round(agg.completionStats[0]?.completionRate || 0);

  // Fill all 7 days including zeros
  const dailyMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dailyMap[d.toISOString().split('T')[0]] = 0;
  }
  (agg.dailyParticipation || []).forEach(({ _id, count }) => {
    if (dailyMap[_id] !== undefined) dailyMap[_id] = count;
  });

  const pollAgeHours = (Date.now() - new Date(poll.createdAt)) / 3600000;
  const responsesPerHour = pollAgeHours > 0 ? totalResponses / pollAgeHours : 0;
  const engagementScore = Math.round(
    Math.min(responsesPerHour * 10, 40) +
    (completionRate / 100) * 35 +
    Math.min(totalResponses * 0.5, 25)
  );

  const anonymousCount = agg.totals[0]?.anonymousCount || 0;

  return {
    pollId: poll._id,
    shareCode: poll.shareCode,
    title: poll.title,
    status: poll.status,
    totalResponses,
    isResultPublished: poll.isResultPublished,
    createdAt: poll.createdAt,
    expiresAt: poll.expiresAt,
    publishedAt: poll.publishedAt,
    questionSummary,
    participationByDay: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
    avgCompletionTime: Math.round(agg.totals[0]?.avgCompletionTime || 0),
    anonymousCount,
    authenticatedCount: totalResponses - anonymousCount,
    completionRate,
    engagementScore,
    recentResponses: (agg.recentResponses || []).map((r) => ({
      id: r._id,
      respondentName: r.isAnonymous ? 'Anonymous' : r.respondentName,
      submittedAt: r.submittedAt,
      completionTime: r.completionTime,
    })),
  };
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
exports.getDashboardStats = async (userId) => {
  await Poll.updateMany(
    { creator: userId, status: 'active', expiresAt: { $lt: new Date() } },
    { $set: { status: 'expired' } }
  );

  const [totalPolls, activePolls, expiredPolls, publishedPolls] = await Promise.all([
    Poll.countDocuments({ creator: userId }),
    Poll.countDocuments({ creator: userId, status: 'active' }),
    Poll.countDocuments({ creator: userId, status: 'expired' }),
    Poll.countDocuments({ creator: userId, status: 'published' }),
  ]);

  const totalResponsesAgg = await Poll.aggregate([
    { $match: { creator: userId } },
    { $group: { _id: null, total: { $sum: '$totalResponses' } } },
  ]);

  const recentPolls = await Poll.find({ creator: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title status totalResponses createdAt expiresAt shareCode');

  return {
    stats: {
      totalPolls,
      activePolls,
      expiredPolls,
      publishedPolls,
      totalResponses: totalResponsesAgg[0]?.total || 0,
    },
    recentPolls,
  };
};

// ─── Response Submission ──────────────────────────────────────────────────────
// Runs the full atomic transaction — create response + update option counts + increment total.
exports.submitResponse = async ({ poll, answers, completionTime, userId, respondentName, ip, userAgent }) => {
  const session = await mongoose.startSession();
  let updatedPoll;

  try {
    await session.withTransaction(async () => {
      await Response.create([{
        poll: poll._id,
        respondent: userId || null,
        isAnonymous: !userId || poll.isAnonymous,
        respondentName: respondentName || 'Anonymous',
        answers,
        ipAddress: ip,
        userAgent,
        completionTime: completionTime || null,
      }], { session });

      for (const ans of answers) {
        await Poll.updateOne(
          { _id: poll._id, 'questions._id': ans.questionId, 'questions.options._id': ans.selectedOptionId },
          { $inc: { 'questions.$[q].options.$[o].count': 1 } },
          { arrayFilters: [{ 'q._id': ans.questionId }, { 'o._id': ans.selectedOptionId }], session }
        );
      }

      updatedPoll = await Poll.findByIdAndUpdate(
        poll._id,
        { $inc: { totalResponses: 1 } },
        { new: true, session }
      );

      if (userId) {
        await User.findByIdAndUpdate(
          poll.creator,
          { $inc: { totalResponsesReceived: 1 } },
          { session }
        );
      }
    });
  } catch (err) {
    // Standalone MongoDB doesn't support transactions — fall back to non-transactional writes.
    // This ensures the app works in dev/hobby deployments without a replica set.
    if (err.message?.includes('Transaction numbers are only allowed on a replica set')) {
      await Response.create([{
        poll: poll._id,
        respondent: userId || null,
        isAnonymous: !userId || poll.isAnonymous,
        respondentName: respondentName || 'Anonymous',
        answers,
        ipAddress: ip,
        userAgent,
        completionTime: completionTime || null,
      }]);

      for (const ans of answers) {
        await Poll.updateOne(
          { _id: poll._id, 'questions._id': ans.questionId, 'questions.options._id': ans.selectedOptionId },
          { $inc: { 'questions.$[q].options.$[o].count': 1 } },
          { arrayFilters: [{ 'q._id': ans.questionId }, { 'o._id': ans.selectedOptionId }] }
        );
      }

      updatedPoll = await Poll.findByIdAndUpdate(
        poll._id,
        { $inc: { totalResponses: 1 } },
        { new: true }
      );

      if (userId) {
        await User.findByIdAndUpdate(poll.creator, { $inc: { totalResponsesReceived: 1 } });
      }
    } else {
      throw err;
    }
  } finally {
    session.endSession();
  }

  const milestone = checkMilestone(updatedPoll.totalResponses);
  return { updatedPoll, milestone };
};