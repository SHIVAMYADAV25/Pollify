import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, AlertCircle, CheckCircle, Lock, Users, ArrowRight, Send, BarChart3,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { connectSocket, leavePollRoom } from '../../lib/socket';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function CountdownTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const isExpired = remaining === 'Expired';
  return (
    <span className="flex items-center gap-1.5 text-xs font-mono">
      <Clock size={11} style={{ color: isExpired ? 'var(--coral)' : 'var(--gold)' }} />
      <span style={{ color: isExpired ? 'var(--coral)' : 'var(--gold)' }}>{remaining}</span>
    </span>
  );
}

const StateScreen = ({ children }) => (
  <div
    className="min-h-screen flex items-center justify-center px-4"
    style={{ background: 'var(--parchment)' }}
  >
    {children}
  </div>
);

export default function TakePollPage() {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollStatus, setPollStatus] = useState(null);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => { loadPoll(); }, [shareCode, isAuthenticated]);

  useEffect(() => {
  if (!poll || poll.status !== 'active') return;
  const socket = connectSocket();
  socket.emit('join:poll', shareCode);

  // Named references so .off() only removes THIS component's listeners
  const handleResponseNew = (data) => setLiveCount(data.totalResponses || 0);
  const handleExpired = () => { setPollStatus('expired'); toast.error('This poll has just expired.'); };
  const handlePublished = () => navigate(`/poll/${shareCode}/results`);

  socket.on('response:new', handleResponseNew);
  socket.on('poll:expired', handleExpired);
  socket.on('poll:published', handlePublished);

  return () => {
    socket.off('response:new', handleResponseNew);
    socket.off('poll:expired', handleExpired);
    socket.off('poll:published', handlePublished);
    leavePollRoom(shareCode);
  };
}, [poll?.status, shareCode, navigate]);

  const loadPoll = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/polls/share/${shareCode}`);
      const { poll: p, alreadyResponded: ar, isPublished } = res.data;
      setPoll(p);
      setAlreadyResponded(ar || false);
      setLiveCount(p.totalResponses || 0);
      if (isPublished || p.status === 'published') {
        navigate(`/poll/${shareCode}/results`, { replace: true });
        return;
      }
      setPollStatus(p.status);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Poll not found');
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (questionId, optionId) => {
    setAnswers((a) => ({ ...a, [questionId]: optionId }));
    setErrors((e) => { const ne = { ...e }; delete ne[questionId]; return ne; });
  };

  const validate = () => {
    const e = {};
    poll.questions.forEach((q) => {
      if (q.isMandatory && !answers[q._id]) e[q._id] = 'This question is required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { toast.error('Please answer all required questions'); return; }
    if (!poll.isAnonymous && !isAuthenticated) {
      toast.error('This poll requires you to be logged in');
      navigate(`/login?redirect=/poll/${shareCode}`);
      return;
    }
    const completionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setSubmitting(true);
    try {
      await api.post(`/responses/${shareCode}/submit`, {
        answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })),
        completionTime,
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed';
      if (err.response?.status === 410) { setPollStatus('expired'); toast.error(msg); }
      else if (err.response?.status === 409) { setAlreadyResponded(true); toast.error(msg); }
      else if (err.response?.status === 401) {
        toast.error('Please log in to respond');
        navigate(`/login?redirect=/poll/${shareCode}`);
      } else { toast.error(msg); }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StateScreen>
        <LoadingSpinner size="lg" />
      </StateScreen>
    );
  }

  // ── Expired ──────────────────────────────────────────────────────────
  if (pollStatus === 'expired' && !submitted) {
    return (
      <StateScreen>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="card max-w-md w-full text-center py-12 px-8"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--coral-light)' }}
          >
            <Clock size={24} style={{ color: 'var(--coral)' }} />
          </div>
          <h2 className="font-serif text-2xl mb-2" style={{ color: 'var(--ink)' }}>Poll Expired</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--ink-muted)' }}>This poll closed on</p>
          <p className="text-sm font-mono mb-6" style={{ color: 'var(--ink-light)' }}>
            {format(new Date(poll.expiresAt), 'MMM d, yyyy · HH:mm')}
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--ink-muted)' }}>
            No further responses are being accepted.
          </p>
          <Link to="/" className="btn btn-secondary">← Back to Home</Link>
        </motion.div>
      </StateScreen>
    );
  }

  // ── Already responded ─────────────────────────────────────────────────
  if (alreadyResponded && !submitted) {
    return (
      <StateScreen>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="card max-w-md w-full text-center py-12 px-8"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--sage-light)' }}
          >
            <CheckCircle size={24} style={{ color: 'var(--sage)' }} />
          </div>
          <h2 className="font-serif text-2xl mb-2" style={{ color: 'var(--ink)' }}>Already Responded</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--ink-muted)' }}>
            You've already submitted a response to this poll.
          </p>
          <Link to="/" className="btn btn-secondary">← Back to Home</Link>
        </motion.div>
      </StateScreen>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <StateScreen>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, type: 'spring' }}
          className="card max-w-md w-full text-center py-14 px-8"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--sage)' }}
          >
            <CheckCircle size={28} color="#fff" />
          </motion.div>
          <h2 className="font-serif text-2xl mb-2" style={{ color: 'var(--ink)' }}>Response Submitted!</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--ink-muted)' }}>
            Thank you for participating in{' '}
            <span className="font-medium" style={{ color: 'var(--ink)' }}>"{poll.title}"</span>.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn btn-secondary text-sm">← Home</Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="btn btn-primary text-sm">Dashboard</Link>
            )}
          </div>
        </motion.div>
      </StateScreen>
    );
  }

  // ── Auth required ─────────────────────────────────────────────────────
  if (!poll.isAnonymous && !isAuthenticated) {
    return (
      <StateScreen>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="card max-w-md w-full text-center py-12 px-8"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--sky-light)' }}
          >
            <Lock size={24} style={{ color: 'var(--sky)' }} />
          </div>
          <h2 className="font-serif text-2xl mb-2" style={{ color: 'var(--ink)' }}>Login Required</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
            This poll requires authentication to participate.
          </p>
          <Link
            to={`/login?redirect=/poll/${shareCode}`}
            className="btn btn-primary w-full justify-center"
          >
            Sign in to respond <ArrowRight size={15} />
          </Link>
        </motion.div>
      </StateScreen>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = poll.questions?.length || 0;
  const mandatoryCount = poll.questions?.filter((q) => q.isMandatory).length || 0;
  const answeredMandatory = poll.questions?.filter((q) => q.isMandatory && answers[q._id]).length || 0;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--parchment)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Branding */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--sage)' }}
          >
            <BarChart3 size={14} color="#fff" strokeWidth={2} />
          </div>
          <span className="font-serif text-base" style={{ color: 'var(--ink-muted)' }}>Pollify</span>
        </div>

        {/* Poll header card */}
        <motion.div
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          className="card mb-5"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="font-serif text-2xl leading-tight" style={{ color: 'var(--ink)' }}>
              {poll.title}
            </h1>
            <span className={`tag flex-shrink-0 ${poll.isAnonymous ? 'tag-active' : 'tag-published'}`}>
              {poll.isAnonymous ? 'Anonymous' : 'Auth required'}
            </span>
          </div>

          {poll.description && (
            <p className="text-sm mb-3" style={{ color: 'var(--ink-muted)' }}>{poll.description}</p>
          )}

          <div
            className="flex items-center gap-4 text-xs flex-wrap pt-3"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--ink-faint)' }}
          >
            <span className="flex items-center gap-1.5">
              <Users size={11} /> {liveCount} response{liveCount !== 1 ? 's' : ''}
            </span>
            <CountdownTimer expiresAt={poll.expiresAt} />
            <span>{totalQuestions} question{totalQuestions !== 1 ? 's' : ''} · {mandatoryCount} required</span>
            {!poll.isAnonymous && user && (
              <span className="flex items-center gap-1" style={{ color: 'var(--sage)' }}>
                <CheckCircle size={11} /> Responding as {user.name}
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--ink-faint)' }}>
              <span>{answeredCount}/{totalQuestions} answered</span>
              <span style={{ color: 'var(--sage)' }}>{progress}%</span>
            </div>
            <div className="progress-bar">
              <motion.div className="progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        </motion.div>

        {/* Questions */}
        <div className="space-y-4 mb-8">
          <AnimatePresence>
            {poll.questions?.map((q, qi) => (
              <motion.div
                key={q._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: qi * 0.06 }}
                className="card"
                style={errors[q._id] ? { border: '1.5px solid rgba(217,96,74,0.4)', background: 'rgba(217,96,74,0.02)' } : {}}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-xs font-mono mt-1 w-6 flex-shrink-0" style={{ color: 'var(--ink-faint)' }}>
                    {qi + 1}.
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <h3 className="font-medium text-base" style={{ color: 'var(--ink)' }}>{q.text}</h3>
                      {q.isMandatory
                        ? <span style={{ color: 'var(--coral)', fontWeight: 600 }}>*</span>
                        : <span className="tag tag-draft text-xs">Optional</span>}
                    </div>

                    <div className="space-y-2.5">
                      {q.options?.map((o) => (
                        <button
                          key={o._id}
                          type="button"
                          onClick={() => selectOption(q._id, o._id)}
                          className={`option-card ${answers[q._id] === o._id ? 'selected' : ''}`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150"
                            style={{
                              borderColor: answers[q._id] === o._id ? 'var(--sage)' : 'var(--border-strong)',
                              background: answers[q._id] === o._id ? 'var(--sage)' : 'transparent',
                            }}
                          >
                            {answers[q._id] === o._id && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span
                            className="text-sm"
                            style={{
                              color: answers[q._id] === o._id ? 'var(--sage)' : 'var(--ink-light)',
                              fontWeight: answers[q._id] === o._id ? 500 : 400,
                            }}
                          >
                            {o.text}
                          </span>
                        </button>
                      ))}
                    </div>

                    {errors[q._id] && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 text-xs mt-3"
                        style={{ color: 'var(--coral)' }}
                      >
                        <AlertCircle size={11} /> {errors[q._id]}
                      </motion.p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Submit bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (poll.questions?.length || 0) * 0.06 + 0.15 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            {answeredMandatory < mandatoryCount ? (
              `${mandatoryCount - answeredMandatory} required question${mandatoryCount - answeredMandatory !== 1 ? 's' : ''} remaining`
            ) : (
              <span className="flex items-center gap-1" style={{ color: 'var(--sage)' }}>
                <CheckCircle size={11} /> All required questions answered
              </span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary px-8 py-3"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span
                  className="spinner"
                  style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }}
                />
                Submitting...
              </span>
            ) : (
              <><Send size={16} /> Submit Response</>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}