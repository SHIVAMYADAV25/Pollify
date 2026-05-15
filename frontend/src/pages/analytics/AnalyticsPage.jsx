import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import {
  ArrowLeft, Users, Clock, TrendingUp, BarChart3, Globe, Share2,
  CheckCircle, Activity, Award, RefreshCw, Zap, Heart,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { connectSocket, leavePollRoom, leaveAdminRoom } from '../../lib/socket';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CHART_HEX = ['#4A7C59', '#D9604A', '#C8941A', '#4A7EA8', '#9b8bc4', '#5ba8a0', '#d48b6a', '#7b9e44'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-sm"
      style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
      {label && <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-medium" style={{ color: p.color || 'var(--sage)' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'var(--sage)', bg = 'var(--sage-light)', delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }} className="stat-card">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
      <Icon size={18} style={{ color }} />
    </div>
    <div className="text-2xl font-serif font-semibold mb-1" style={{ color: 'var(--ink)' }}>{value}</div>
    <div className="text-sm" style={{ color: 'var(--ink-muted)' }}>{label}</div>
    {sub && <div className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>{sub}</div>}
  </motion.div>
);

const EngagementBar = ({ score }) => {
  const pct = Math.min(score, 100);
  const color = pct >= 70 ? 'var(--sage)' : pct >= 40 ? 'var(--gold)' : 'var(--coral)';
  const label = pct >= 70 ? 'Excellent' : pct >= 40 ? 'Good' : 'Growing';
  return (
    <div className="mt-2">
      <div className="progress-bar" style={{ height: 8 }}>
        <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }} style={{ background: color, height: '100%' }} />
      </div>
      <p className="text-xs mt-1" style={{ color }}>{label}</p>
    </div>
  );
};

export default function AnalyticsPage() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get(`/polls/${id}/analytics`);
      setAnalytics(res.data.analytics);
      setLastUpdated(new Date());
    } catch {
      if (!silent) toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

// Socket setup — joins isolated admin room (poll:admin:{shareCode}), not the public respondent room
useEffect(() => {
  if (!analytics?.shareCode) return;

  const socket = connectSocket();
  const shareCode = analytics.shareCode;

  // Join public poll room to receive poll:expired / poll:published lifecycle events
  socket.emit('join:poll', shareCode);
  // Join isolated admin analytics room — receives response:new separately from respondents
  socket.emit('join:admin', shareCode);

  const handleResponseNew = () => {
    setLiveCount((c) => c + 1);
    loadAnalytics(true);
  };

  socket.on('response:new', handleResponseNew);

  // Proper cleanup — leave both rooms, remove only this component's listener
  return () => {
    socket.off('response:new', handleResponseNew);
    leavePollRoom(shareCode);
    leaveAdminRoom(shareCode);
  };
}, [analytics?.shareCode, loadAnalytics]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!analytics) return null;

  const avgTime = analytics.avgCompletionTime
    ? `${Math.floor(analytics.avgCompletionTime / 60)}m ${analytics.avgCompletionTime % 60}s`
    : 'N/A';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link to={`/polls/${id}`} className="inline-flex items-center gap-2 text-sm mb-4 transition-colors"
          style={{ color: 'var(--ink-muted)' }}>
          <ArrowLeft size={15} /> Back to Poll
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl mb-2" style={{ color: 'var(--ink)' }}>{analytics.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`tag ${analytics.status === 'active' ? 'tag-active' : analytics.status === 'published' ? 'tag-published' : 'tag-expired'}`}>
                {analytics.status}
              </span>
              {analytics.status === 'active' && (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--sage)' }}>
                  <span className="live-dot" /> Live analytics
                </span>
              )}
              {lastUpdated && (
                <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                  Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </span>
              )}
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--sage-light)', color: 'var(--sage)', border: '1px solid rgba(74,124,89,0.2)' }}>
                  <Zap size={10} /> +{liveCount} new
                </span>
              )}
            </div>
          </div>
          <button onClick={() => loadAnalytics(true)} disabled={refreshing} className="btn btn-secondary">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* 5 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Users} label="Total Responses" value={analytics.totalResponses}
          color="var(--sage)" bg="var(--sage-light)" delay={0} />
        <StatCard icon={Activity} label="Completion Rate" value={`${analytics.completionRate || 0}%`}
          color="var(--coral)" bg="var(--coral-light)" delay={0.05} />
        <StatCard icon={Clock} label="Avg. Time" value={avgTime}
          color="var(--sky)" bg="var(--sky-light)" delay={0.1} />
        <StatCard icon={Globe} label="Response Mode"
          value={analytics.anonymousCount > analytics.authenticatedCount ? 'Anonymous' : 'Auth'}
          sub={`${analytics.anonymousCount} anon · ${analytics.authenticatedCount} auth`}
          color="var(--gold)" bg="var(--gold-light)" delay={0.15} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }} className="stat-card">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'var(--gold-light)' }}>
            <Heart size={18} style={{ color: 'var(--gold)' }} />
          </div>
          <div className="text-2xl font-serif font-semibold mb-1" style={{ color: 'var(--ink)' }}>
            {analytics.engagementScore ?? 0}
            <span className="text-base font-sans font-normal" style={{ color: 'var(--ink-faint)' }}>/100</span>
          </div>
          <div className="text-sm" style={{ color: 'var(--ink-muted)' }}>Poll Health</div>
          <EngagementBar score={analytics.engagementScore ?? 0} />
        </motion.div>
      </div>

      {/* Trend chart */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }} className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <TrendingUp size={16} style={{ color: 'var(--sage)' }} /> Response Trend (Last 7 Days)
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={analytics.participationByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--ink-faint)', fontSize: 11 }}
              tickFormatter={(v) => format(new Date(v + 'T12:00:00'), 'MMM d')} />
            <YAxis tick={{ fill: 'var(--ink-faint)', fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="count" stroke="#4A7C59" strokeWidth={2.5}
              dot={{ fill: '#4A7C59', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#4A7C59' }} name="Responses" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Question summaries */}
      <h2 className="font-semibold text-lg mb-5 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
        <BarChart3 size={18} style={{ color: 'var(--coral)' }} /> Question-wise Results
      </h2>
      <div className="space-y-5 mb-8">
        {analytics.questionSummary.map((q, qi) => {
          const winner = q.options.reduce((a, b) => (a.count >= b.count ? a : b), q.options[0] || { count: 0 });
          return (
            <motion.div key={q.questionId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + qi * 0.07 }} className="card">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-xs font-mono mt-0.5 flex-shrink-0" style={{ color: 'var(--ink-faint)' }}>Q{qi + 1}</span>
                    <div>
                      <h3 className="font-medium text-base mb-1" style={{ color: 'var(--ink)' }}>{q.questionText}</h3>
                      <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'var(--ink-faint)' }}>
                        <span className={`tag ${q.isMandatory ? 'tag-active' : 'tag-draft'}`}>
                          {q.isMandatory ? 'Required' : 'Optional'}
                        </span>
                        <span>{q.totalAnswers} answers</span>
                        {winner && q.totalAnswers > 0 && (
                          <span className="flex items-center gap-1" style={{ color: 'var(--sage)' }}>
                            <Award size={11} /> Leading: "{winner.text}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {q.options.map((o, oi) => (
                      <div key={o.optionId}>
                        <div className="flex items-center justify-between mb-1.5 text-sm">
                          <span className="truncate max-w-[65%]" style={{ color: 'var(--ink-light)' }}>{o.text}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>{o.count}</span>
                            <span className="font-semibold text-sm" style={{ color: CHART_HEX[oi % CHART_HEX.length] }}>
                              {o.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <motion.div className="progress-fill" initial={{ width: 0 }}
                            animate={{ width: `${o.percentage}%` }}
                            transition={{ duration: 0.7, delay: 0.3 + qi * 0.1, ease: 'easeOut' }}
                            style={{ background: CHART_HEX[oi % CHART_HEX.length] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {q.totalAnswers > 0 && (
                  <div className="lg:w-52 flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={q.options.filter((o) => o.count > 0)} dataKey="count" nameKey="text"
                          cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={3}>
                          {q.options.filter((o) => o.count > 0).map((_, i) => (
                            <Cell key={i} fill={CHART_HEX[i % CHART_HEX.length]} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                      {q.options.filter((o) => o.count > 0).map((o, i) => (
                        <div key={o.optionId} className="flex items-center gap-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_HEX[i % CHART_HEX.length] }} />
                          <span className="truncate max-w-[72px]">{o.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }} className="card">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: 'var(--ink-muted)' }}>
            Response Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={[
              { name: 'Anonymous', count: analytics.anonymousCount },
              { name: 'Authenticated', count: analytics.authenticatedCount },
            ]} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--ink-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--ink-faint)', fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Responses" radius={[6, 6, 0, 0]}>
                <Cell fill="#4A7C59" />
                <Cell fill="#D9604A" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }} className="card">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--ink-muted)' }}>
            Recent Submissions
          </h3>
          {!analytics.recentResponses?.length ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--ink-faint)' }}>No responses yet</p>
          ) : (
            <div className="scroll-list space-y-2">
              {analytics.recentResponses.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm py-2"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                      style={{ background: 'var(--sage-light)', color: 'var(--sage)' }}>
                      {r.respondentName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <span style={{ color: 'var(--ink-light)' }}>{r.respondentName}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                    {formatDistanceToNow(new Date(r.submittedAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {analytics.status === 'expired' && !analytics.isResultPublished && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card flex items-center justify-between gap-4 p-5"
          style={{ border: '1px solid rgba(74,126,168,0.25)', background: 'var(--sky-light)' }}>
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--sky)' }}>
              <CheckCircle size={16} /> Ready to publish?
            </h3>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              Share the final results publicly so anyone with the link can view them.
            </p>
          </div>
          <Link to={`/polls/${id}`} className="btn flex-shrink-0"
            style={{ background: 'var(--sky)', color: '#fff', border: 'none' }}>
            <Globe size={15} /> Publish Results
          </Link>
        </motion.div>
      )}

      {analytics.isResultPublished && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card flex items-center justify-between gap-4 p-5"
          style={{ border: '1px solid rgba(74,124,89,0.2)', background: 'var(--sage-light)' }}>
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--sage)' }}>
              <Globe size={16} /> Results are public
            </h3>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              Published {analytics.publishedAt ? formatDistanceToNow(new Date(analytics.publishedAt), { addSuffix: true }) : ''}
            </p>
          </div>
          <a href={`/poll/${analytics.shareCode}/results`} target="_blank" rel="noreferrer"
            className="btn btn-secondary flex-shrink-0">
            <Share2 size={15} /> View Public Page
          </a>
        </motion.div>
      )}
    </div>
  );
}