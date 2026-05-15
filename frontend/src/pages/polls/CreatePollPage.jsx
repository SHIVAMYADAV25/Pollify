import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, AlertCircle, Save, Eye, EyeOff, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const defaultQuestion = () => ({
  id: Math.random().toString(36).slice(2),
  text: '',
  isMandatory: true,
  options: [
    { id: Math.random().toString(36).slice(2), text: '' },
    { id: Math.random().toString(36).slice(2), text: '' },
  ],
});

const makeOpts = (arr) => arr.map(text => ({ id: Math.random().toString(36).slice(2), text }));

const TEMPLATES = [
  {
    id: 'nps', label: 'NPS Survey', emoji: '📊',
    title: 'Net Promoter Score Survey',
    questions: [
      { text: 'How likely are you to recommend us to a friend or colleague?', isMandatory: true, options: makeOpts(['0 - Not at all likely', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10 - Extremely likely']) },
      { text: 'What is the primary reason for your score?', isMandatory: false, options: makeOpts(['Product quality', 'Customer service', 'Price / Value', 'Ease of use', 'Other']) },
    ],
  },
  {
    id: 'retro', label: 'Retrospective', emoji: '🔄',
    title: 'Sprint Retrospective',
    questions: [
      { text: 'What went well this sprint?', isMandatory: true, options: makeOpts(['Team collaboration', 'Code quality', 'Delivery speed', 'Communication', 'Planning']) },
      { text: 'What should we improve next sprint?', isMandatory: true, options: makeOpts(['Testing coverage', 'Documentation', 'Meeting efficiency', 'Tooling', 'Process']) },
      { text: 'Overall, how would you rate this sprint?', isMandatory: true, options: makeOpts(['Excellent', 'Good', 'Average', 'Below average', 'Poor']) },
    ],
  },
  {
    id: 'event', label: 'Event Feedback', emoji: '🎟️',
    title: 'Event Feedback Form',
    questions: [
      { text: 'How would you rate the event overall?', isMandatory: true, options: makeOpts(['Excellent', 'Good', 'Average', 'Below average', 'Poor']) },
      { text: 'How was the event organisation?', isMandatory: true, options: makeOpts(['Very organised', 'Mostly organised', 'Somewhat disorganised', 'Poorly organised']) },
      { text: 'Would you attend this event again?', isMandatory: true, options: makeOpts(['Definitely yes', 'Probably yes', 'Unsure', 'Probably not', 'Definitely not']) },
    ],
  },
];

const PRESET_HOURS = [1, 6, 24, 48, 72, 168];
const hourLabel = (h) => h < 24 ? `${h}h` : h === 168 ? '7d' : `${h / 24}d`;

export default function CreatePollPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([defaultQuestion()]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [expiryHours, setExpiryHours] = useState(24);
  const [customExpiry, setCustomExpiry] = useState('');
  const [expiryMode, setExpiryMode] = useState('preset');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setQuestions(
      tpl.questions.map(q => ({
        id: Math.random().toString(36).slice(2),
        text: q.text,
        isMandatory: q.isMandatory,
        options: q.options,
      }))
    );
    setErrors({});
    toast.success(`Template "${tpl.label}" applied!`);
  };

  const addQuestion = () => {
    if (questions.length >= 20) return toast.error('Maximum 20 questions allowed');
    setQuestions(q => [...q, defaultQuestion()]);
  };

  const removeQuestion = (id) => {
    if (questions.length <= 1) return toast.error('At least one question is required');
    setQuestions(q => q.filter(x => x.id !== id));
  };

  const updateQuestion = (id, key, value) =>
    setQuestions(q => q.map(x => x.id === id ? { ...x, [key]: value } : x));

  const addOption = (qId) => {
    setQuestions(q =>
      q.map(x => {
        if (x.id !== qId) return x;
        if (x.options.length >= 10) { toast.error('Max 10 options'); return x; }
        return { ...x, options: [...x.options, { id: Math.random().toString(36).slice(2), text: '' }] };
      })
    );
  };

  const removeOption = (qId, oId) => {
    setQuestions(q =>
      q.map(x => {
        if (x.id !== qId) return x;
        if (x.options.length <= 2) { toast.error('Minimum 2 options required'); return x; }
        return { ...x, options: x.options.filter(o => o.id !== oId) };
      })
    );
  };

  const updateOption = (qId, oId, text) =>
    setQuestions(q =>
      q.map(x => x.id !== qId ? x : { ...x, options: x.options.map(o => o.id === oId ? { ...o, text } : o) })
    );

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Poll title is required';
    questions.forEach((q, i) => {
      if (!q.text.trim()) e[`q_${i}`] = 'Question text is required';
      q.options.forEach((o, j) => {
        if (!o.text.trim()) e[`q_${i}_o_${j}`] = 'Option text is required';
      });
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the errors below'); return; }

    const expiresAt = expiryMode === 'preset'
      ? new Date(Date.now() + expiryHours * 3600000).toISOString()
      : new Date(customExpiry).toISOString();

    if (new Date(expiresAt) <= new Date()) {
      toast.error('Expiry must be in the future');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/polls', {
        title: title.trim(),
        description: description.trim(),
        questions: questions.map((q, i) => ({
          text: q.text.trim(),
          isMandatory: q.isMandatory,
          order: i,
          options: q.options.map(o => ({ text: o.text.trim() })),
        })),
        isAnonymous,
        expiresAt,
      });
      toast.success('Poll created!');
      navigate(`/polls/${res.data.poll._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ num, title: t }) => (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="step-badge">{num}</span>
      <h2 className="font-semibold text-base" style={{ color: 'var(--ink)' }}>{t}</h2>
    </div>
  );

  const FieldError = ({ msg }) =>
    msg ? (
      <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: 'var(--coral)' }}>
        <AlertCircle size={11} /> {msg}
      </p>
    ) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <div className="mb-8">
          <h1 className="font-serif text-3xl mb-2" style={{ color: 'var(--ink)' }}>Create a Poll</h1>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Build questions, configure settings, and share your unique link.</p>
        </div>

        {/* Templates */}
        <div className="card mb-5">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--ink-muted)' }}>
            Start from a template
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="btn btn-secondary btn-sm"
              >
                {tpl.emoji} {tpl.label}
              </button>
            ))}
            <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>or build from scratch below</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* Step 1: Details */}
          <div className="card mb-5">
            <SectionHeader num="1" title="Poll Details" />
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ink-muted)' }}>
                  Title <span style={{ color: 'var(--coral)' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.title ? 'error' : ''}`}
                  placeholder="e.g. Team lunch preferences"
                  value={title}
                  maxLength={200}
                  onChange={(e) => { setTitle(e.target.value); setErrors(er => ({ ...er, title: '' })); }}
                />
                <FieldError msg={errors.title} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ink-muted)' }}>
                  Description <span className="normal-case font-normal" style={{ color: 'var(--ink-faint)' }}>(optional)</span>
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Add context for your respondents..."
                  value={description}
                  maxLength={1000}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Step 2: Questions */}
          <div className="card mb-5">
            <SectionHeader num="2" title={`Questions (${questions.length}/20)`} />
            <div className="space-y-4">
              <AnimatePresence>
                {questions.map((q, qi) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="rounded-xl p-4"
                    style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-start gap-2.5 mb-3">
                      <span className="text-xs font-mono mt-2.5 w-5 flex-shrink-0" style={{ color: 'var(--ink-faint)' }}>Q{qi + 1}</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          className={`input-field ${errors[`q_${qi}`] ? 'error' : ''}`}
                          placeholder="Enter your question..."
                          value={q.text}
                          maxLength={500}
                          onChange={(e) => { updateQuestion(q.id, 'text', e.target.value); setErrors(er => ({ ...er, [`q_${qi}`]: '' })); }}
                        />
                        <FieldError msg={errors[`q_${qi}`]} />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="mt-1.5 p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--ink-faint)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="ml-7 space-y-2 mb-3">
                      <AnimatePresence>
                        {q.options.map((o, oi) => (
                          <motion.div key={o.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'var(--ink-faint)' }} />
                            <input
                              type="text"
                              className={`input-field text-sm py-2 ${errors[`q_${qi}_o_${oi}`] ? 'error' : ''}`}
                              placeholder={`Option ${oi + 1}`}
                              value={o.text}
                              maxLength={200}
                              onChange={(e) => { updateOption(q.id, o.id, e.target.value); setErrors(er => ({ ...er, [`q_${qi}_o_${oi}`]: '' })); }}
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(q.id, o.id)}
                              className="p-1.5 rounded-lg flex-shrink-0 transition-colors"
                              style={{ color: 'var(--ink-faint)' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <button
                        type="button"
                        onClick={() => addOption(q.id)}
                        className="ml-6 text-xs flex items-center gap-1.5 py-1 transition-colors"
                        style={{ color: 'var(--ink-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--sage)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
                      >
                        <Plus size={13} /> Add option
                      </button>
                    </div>

                    <div className="ml-7 flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => updateQuestion(q.id, 'isMandatory', !q.isMandatory)}
                        className={`toggle ${q.isMandatory ? 'toggle-on' : 'toggle-off'}`}
                      >
                        <span className={`toggle-thumb ${q.isMandatory ? 'toggle-thumb-on' : 'toggle-thumb-off'}`} />
                      </button>
                      <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                        {q.isMandatory ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button type="button" onClick={addQuestion} className="btn-dashed mt-4">
              <Plus size={16} /> Add Question
            </button>
          </div>

          {/* Step 3: Settings */}
          <div className="card mb-8">
            <SectionHeader num="3" title="Settings" />
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isAnonymous ? <EyeOff size={15} style={{ color: 'var(--ink-muted)' }} /> : <Eye size={15} style={{ color: 'var(--ink-muted)' }} />}
                    <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Response Mode</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {isAnonymous ? 'Anonymous — no login required, identities hidden.' : 'Authenticated — respondents must log in.'}
                  </p>
                </div>
                <button type="button" onClick={() => setIsAnonymous(v => !v)} className={`toggle ${isAnonymous ? 'toggle-on' : 'toggle-off'}`}>
                  <span className={`toggle-thumb ${isAnonymous ? 'toggle-thumb-on' : 'toggle-thumb-off'}`} />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={15} style={{ color: 'var(--ink-muted)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Poll Expiry</span>
                </div>
                <div className="flex gap-1 p-1 rounded-xl mb-3 w-fit" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
                  {['preset', 'custom'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setExpiryMode(m)}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                      style={expiryMode === m
                        ? { background: '#fff', color: 'var(--ink)', boxShadow: 'var(--shadow-sm)' }
                        : { color: 'var(--ink-muted)', background: 'transparent' }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                {expiryMode === 'preset' ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_HOURS.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setExpiryHours(h)}
                        className="py-2 px-3 rounded-xl text-xs font-medium transition-all"
                        style={expiryHours === h
                          ? { background: 'var(--sage)', color: '#fff', border: '1.5px solid var(--sage)' }
                          : { background: 'var(--parchment)', color: 'var(--ink-muted)', border: '1.5px solid var(--border)' }}
                      >
                        {hourLabel(h)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={customExpiry}
                    min={new Date(Date.now() + 300000).toISOString().slice(0, 16)}
                    onChange={(e) => setCustomExpiry(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary px-8">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />
                  Creating...
                </span>
              ) : (
                <><Save size={16} /> Create Poll</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}