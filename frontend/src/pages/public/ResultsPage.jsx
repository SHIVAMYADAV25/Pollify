import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  BarChart3, Users, Clock, Award, Globe, ArrowLeft, CheckCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CHART_HEX = ['#4A7C59', '#D9604A', '#C8941A', '#4A7EA8', '#9b8bc4', '#5ba8a0', '#d48b6a', '#7b9e44'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm"
      style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
    >
      {payload.map((p, i) => (
        <p key={i} className="font-medium" style={{ color: p.color || 'var(--sage)' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function ResultsPage() {
  const { shareCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const res = await api.get(`/polls/share/${shareCode}`);
        if (!res.data.isPublished && res.data.poll?.status !== 'published') {
          setError('Results have not been published yet.');
          return;
        }
        setData(res.data.poll);
      } catch (err) {
        setError(err.response?.data?.message || 'Poll not found');
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    loadResults();
  }, [shareCode]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--parchment)' }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--parchment)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full text-center py-12 px-8"
        >
          <div className="empty-icon mb-2">
            <Globe size={24} />
          </div>
          <h2 className="font-serif text-2xl mb-2" style={{ color: 'var(--ink)' }}>Results Not Available</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--ink-muted)' }}>
            {error || 'The results for this poll are not publicly available yet.'}
          </p>
          <Link to="/" className="btn btn-secondary">← Back to Home</Link>
        </motion.div>
      </div>
    );
  }

  // Compute summaries from option counts
  const questionSummaries  = data.questions;

  return (
    <div className="min-h-screen" style={{ background: 'var(--parchment)' }}>

      {/* Top banner */}
      <div style={{ background: 'var(--sage)', padding: '0.75rem 1rem' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <BarChart3 size={13} color="#fff" />
            </div>
            <span className="text-sm font-medium text-white">Pollify</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-white opacity-80">
            <CheckCircle size={12} /> Published Results
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5"
            style={{ background: 'var(--sage-light)', color: 'var(--sage)', border: '1px solid rgba(74,124,89,0.2)' }}
          >
            <Globe size={12} /> Official Results
          </div>

          <h1 className="font-serif text-3xl mb-3" style={{ color: 'var(--ink)' }}>{data.title}</h1>
          {data.description && (
            <p className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>{data.description}</p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-faint)' }}>
              <Users size={12} /> {data.totalResponses} total responses
            </span>
            {data.publishedAt && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-faint)' }}>
                <Clock size={12} /> Published {formatDistanceToNow(new Date(data.publishedAt), { addSuffix: true })}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-faint)' }}>
              <Clock size={12} /> Closed {format(new Date(data.expiresAt), 'MMM d, yyyy')}
            </span>
          </div>
        </motion.div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Responses', value: data.totalResponses, color: 'var(--sage)', bg: 'var(--sage-light)', icon: Users },
            { label: 'Questions', value: data.questions?.length, color: 'var(--sky)', bg: 'var(--sky-light)', icon: BarChart3 },
            { label: 'Poll Status', value: 'Closed', color: 'var(--coral)', bg: 'var(--coral-light)', icon: CheckCircle },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="stat-card"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <s.icon size={17} style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-serif mb-1" style={{ color: 'var(--ink)' }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Question results */}
        <div className="space-y-5">
          {questionSummaries?.map((q, qi) => {
            const winner = q.options.reduce((a, b) => ((a.count || 0) >= (b.count || 0) ? a : b), q.options[0] || {});
            return (
              <motion.div
                key={q._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + qi * 0.08 }}
                className="card"
              >
                {/* Question header */}
                <div className="flex items-start gap-3 mb-5">
                  <span
                    className="text-xs font-mono mt-0.5 flex-shrink-0 w-6"
                    style={{ color: 'var(--ink-faint)' }}
                  >
                    Q{qi + 1}
                  </span>
                  <div>
                    <h3 className="font-medium text-base mb-1" style={{ color: 'var(--ink)' }}>{q.text}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                        {q.totalAnswers} answers
                      </span>
                      {winner && q.totalAnswers > 0 && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--gold)' }}>
                          <Award size={11} /> Leading: "{winner.text}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Progress bars */}
                  <div className="flex-1 space-y-3">
                    {q.options.map((o, oi) => {
                      const isWinner = winner && o._id === winner._id && q.totalAnswers > 0;
                      return (
                        <div key={o._id}>
                          <div className="flex items-center justify-between mb-1.5 text-sm">
                            <span
                              className="truncate max-w-[65%] flex items-center gap-1.5"
                              style={{ color: isWinner ? 'var(--sage)' : 'var(--ink-light)', fontWeight: isWinner ? 500 : 400 }}
                            >
                              {isWinner && <Award size={12} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
                              {o.text}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-mono text-xs" style={{ color: 'var(--ink-faint)' }}>{o.count || 0}</span>
                              <span
                                className="font-semibold text-sm"
                                style={{ color: CHART_HEX[oi % CHART_HEX.length] }}
                              >
                                {o.percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="progress-bar">
                            <motion.div
                              className="progress-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${o.percentage}%` }}
                              transition={{ duration: 0.8, delay: 0.3 + qi * 0.1, ease: 'easeOut' }}
                              style={{ background: CHART_HEX[oi % CHART_HEX.length] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pie chart */}
                  {q.totalAnswers > 0 && (
                    <div className="lg:w-48 flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie
                            data={q.options.filter((o) => (o.count || 0) > 0)}
                            dataKey="count" nameKey="text"
                            cx="50%" cy="50%"
                            innerRadius={36} outerRadius={58} paddingAngle={3}
                          >
                            {q.options.filter((o) => (o.count || 0) > 0).map((_, i) => (
                              <Cell key={i} fill={CHART_HEX[i % CHART_HEX.length]} stroke="transparent" />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                        {q.options.filter((o) => (o.count || 0) > 0).map((o, i) => (
                          <div key={o._id} className="flex items-center gap-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_HEX[i % CHART_HEX.length] }} />
                            <span className="truncate max-w-[68px]">{o.text}</span>
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

        {/* Footer */}
        <div className="mt-10 text-center">
          <Link to="/" className="btn btn-secondary">
            <ArrowLeft size={14} /> Back to Pollify
          </Link>
          <p className="text-xs mt-4" style={{ color: 'var(--ink-faint)' }}>
            These results are final and represent all responses collected during the poll period.
          </p>
        </div>

      </div>
    </div>
  );
}