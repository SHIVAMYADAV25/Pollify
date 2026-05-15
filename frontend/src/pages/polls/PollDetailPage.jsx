
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Copy, CheckCheck, Globe, Clock, Users, XCircle,
  Share2, ArrowLeft, ExternalLink, CheckCircle, Code2, QrCode,
  Layers, X,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import QRCodeComp from '../../components/common/QRCode';

const StatusTag = ({ status }) => {
  const map = { active: 'tag-active', expired: 'tag-expired', published: 'tag-published', draft: 'tag-draft' };
  return <span className={`tag ${map[status] || 'tag-draft'}`}>{status}</span>;
};

const MetaItem = ({ icon: Icon, children }) => (
  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-faint)' }}>
    <Icon size={12} /> {children}
  </span>
);

export default function PollDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [confirm, setConfirm] = useState({ open: false, type: null });
  const [embedCode, setEmbedCode] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  useEffect(() => { loadPoll(); }, [id]);

  const loadPoll = async () => {
    try {
      const res = await api.get(`/polls/${id}`);
      setPoll(res.data.poll);
    } catch {
      toast.error('Poll not found');
      navigate('/polls');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/poll/${poll.shareCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const closePoll = async () => {
    setConfirm({ open: false });
    setActionLoading('close');
    try {
      const res = await api.post(`/polls/${id}/close`);
      setPoll(res.data.poll);
      toast.success('Poll closed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close poll');
    } finally {
      setActionLoading('');
    }
  };

  const publishResults = async () => {
    setConfirm({ open: false });
    setActionLoading('publish');
    try {
      const res = await api.post(`/polls/${id}/publish`);
      setPoll(res.data.poll);
      toast.success('Results published!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    } finally {
      setActionLoading('');
    }
  };

  const duplicatePoll = async () => {
    setActionLoading('duplicate');
    try {
      const res = await api.post(`/polls/${id}/duplicate`);
      toast.success('Poll duplicated!');
      navigate(`/polls/${res.data.poll._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to duplicate');
    } finally {
      setActionLoading('');
    }
  };

  const loadEmbedCode = async () => {
    try {
      const res = await api.get(`/polls/${id}/embed`);
      setEmbedCode(res.data.embedCode);
      setShowEmbed(true);
    } catch (err) {
      toast.error('Failed to load embed code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!poll) return null;

  const isExpired = isPast(new Date(poll.expiresAt));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>

        <Link to="/polls" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors" style={{ color: 'var(--ink-muted)' }}>
          <ArrowLeft size={15} /> Back to Polls
        </Link>

        {/* Header card */}
        <div className="card mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>{poll.title}</h1>
                <StatusTag status={poll.status} />
              </div>
              {poll.description && (
                <p className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>{poll.description}</p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <MetaItem icon={Users}>{poll.totalResponses} responses</MetaItem>
                <MetaItem icon={Clock}>
                  Created {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
                </MetaItem>
                <MetaItem icon={Clock}>
                  {isExpired ? 'Expired' : 'Expires'} {format(new Date(poll.expiresAt), 'MMM d, yyyy HH:mm')}
                </MetaItem>
                <MetaItem icon={Globe}>
                  {poll.isAnonymous ? 'Anonymous responses' : 'Authenticated responses'}
                </MetaItem>
              </div>
            </div>
          </div>
        </div>

        {/* Share link */}
        <div className="card mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--ink-muted)' }}>
            Share Link
          </h2>
          <div className="flex gap-2 mb-3">
            <div
              className="flex-1 px-4 py-3 rounded-xl text-sm font-mono truncate"
              style={{ background: 'var(--parchment)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}
            >
              {window.location.origin}/poll/{poll.shareCode}
            </div>
            <button onClick={copyLink} className="btn btn-secondary flex-shrink-0">
              {copied
                ? <><CheckCheck size={15} style={{ color: 'var(--sage)' }} /> Copied</>
                : <><Copy size={15} /> Copy</>}
            </button>
            <a href={`/poll/${poll.shareCode}`} target="_blank" rel="noreferrer" className="btn btn-ghost flex-shrink-0">
              <ExternalLink size={15} />
            </a>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowQr(v => !v)}
              className={`btn btn-sm ${showQr ? 'btn-primary' : 'btn-secondary'}`}
            >
              <QrCode size={13} /> {showQr ? 'Hide QR' : 'QR Code'}
            </button>
            <button
              onClick={showEmbed ? () => setShowEmbed(false) : loadEmbedCode}
              className={`btn btn-sm ${showEmbed ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Code2 size={13} /> {showEmbed ? 'Hide Embed' : 'Embed Code'}
            </button>
          </div>
        </div>

        {/* QR Code panel */}
        <AnimatePresence>
          {showQr && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card mb-5 overflow-hidden"
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--ink-muted)' }}>
                QR Code
              </h2>
              <div className="flex items-center gap-6 flex-wrap">
                <QRCodeComp value={`${window.location.origin}/poll/${poll.shareCode}`} size={148} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                    Scan to open this poll
                  </p>
                  <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                    Great for printed materials, slide decks, or physical events.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Embed Code panel */}
        <AnimatePresence>
          {showEmbed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card mb-5 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                  Embed Code
                </h2>
                <button onClick={() => setShowEmbed(false)} className="btn btn-ghost btn-sm">
                  <X size={14} />
                </button>
              </div>
              <pre
                className="text-xs p-4 rounded-xl overflow-x-auto mb-3"
                style={{
                  background: 'var(--parchment)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink-muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  lineHeight: 1.6,
                }}
              >
                {embedCode}
              </pre>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(embedCode);
                  setCopiedEmbed(true);
                  toast.success('Embed code copied!');
                  setTimeout(() => setCopiedEmbed(false), 2000);
                }}
                className="btn btn-secondary btn-sm"
              >
                {copiedEmbed
                  ? <><CheckCheck size={13} style={{ color: 'var(--sage)' }} /> Copied</>
                  : <><Copy size={13} /> Copy code</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="card mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--ink-muted)' }}>
            Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link to={`/polls/${id}/analytics`} className="btn btn-secondary">
              <BarChart3 size={15} /> View Analytics
            </Link>

            <button
              onClick={duplicatePoll}
              disabled={actionLoading === 'duplicate'}
              className="btn btn-secondary"
            >
              {actionLoading === 'duplicate' ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'var(--ink-muted)', borderTopColor: 'transparent' }} />
                  Duplicating...
                </span>
              ) : (
                <><Layers size={15} /> Duplicate</>
              )}
            </button>

            {poll.status === 'active' && (
              <button
                onClick={() => setConfirm({ open: true, type: 'close' })}
                disabled={actionLoading === 'close'}
                className="btn btn-danger"
              >
                {actionLoading === 'close' ? (
                  <span className="flex items-center gap-2">
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'var(--coral)', borderTopColor: 'transparent' }} />
                    Closing...
                  </span>
                ) : (
                  <><XCircle size={15} /> Close Poll</>
                )}
              </button>
            )}

            {poll.status === 'expired' && !poll.isResultPublished && (
              <button
                onClick={() => setConfirm({ open: true, type: 'publish' })}
                disabled={actionLoading === 'publish'}
                className="btn btn-primary"
                style={{ background: 'var(--sky)', borderColor: 'var(--sky)' }}
              >
                {actionLoading === 'publish' ? (
                  <span className="flex items-center gap-2">
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />
                    Publishing...
                  </span>
                ) : (
                  <><Globe size={15} /> Publish Results</>
                )}
              </button>
            )}

            {poll.isResultPublished && (
              <a href={`/poll/${poll.shareCode}/results`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                <Share2 size={15} /> View Public Results
              </a>
            )}
          </div>

          {poll.isResultPublished && (
            <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: 'var(--sky)' }}>
              <CheckCircle size={11} /> Results are publicly visible at the poll link.
            </p>
          )}
        </div>

        {/* Questions summary */}
        <div className="card">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--ink-muted)' }}>
            Questions ({poll.questions?.length})
          </h2>
          <div className="space-y-3">
            {poll.questions?.map((q, i) => (
              <div
                key={q._id}
                className="p-4 rounded-xl"
                style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono mt-0.5 w-6 flex-shrink-0" style={{ color: 'var(--ink-faint)' }}>
                    Q{i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{q.text}</span>
                      <span className={`tag ${q.isMandatory ? 'tag-active' : 'tag-draft'} text-xs`}>
                        {q.isMandatory ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {q.options?.map((o) => (
                        <span
                          key={o._id}
                          className="px-2.5 py-1 rounded-lg text-xs"
                          style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}
                        >
                          {o.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </motion.div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirm.open && confirm.type === 'close'}
        title="Close this poll?"
        message="No more responses will be accepted after closing."
        confirmLabel="Close Poll"
        confirmStyle="btn-danger"
        onConfirm={closePoll}
        onCancel={() => setConfirm({ open: false })}
      />
      <ConfirmDialog
        open={confirm.open && confirm.type === 'publish'}
        title="Publish results?"
        message="Anyone with the poll link will be able to see the final results."
        confirmLabel="Publish"
        confirmStyle="btn-primary"
        onConfirm={publishResults}
        onCancel={() => setConfirm({ open: false })}
      />
    </div>
  );
}