import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusCircle, BarChart3, ExternalLink, Trash2, Copy, CheckCheck,
  Search, Clock, Users, Download,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const StatusTag = ({ status }) => {
  const map = { active: 'tag-active', expired: 'tag-expired', published: 'tag-published', draft: 'tag-draft' };
  return <span className={`tag ${map[status] || 'tag-draft'}`}>{status}</span>;
};

const FILTERS = ['all', 'active', 'expired', 'published'];

// Simple debounce hook
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function MyPollsPage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [exporting, setExporting] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, id: null, title: '' });

  // Debounce search input by 300ms
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { loadPolls(); }, []);

  const loadPolls = async () => {
    try {
      const res = await api.get('/polls/my');
      setPolls(res.data.polls || []);
    } catch {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  // Optimistic delete — removes from UI immediately, reverts on error
  const deletePoll = async () => {
    const { id, title } = confirm;
    setConfirm({ open: false });

    // Optimistic: remove from list immediately
    const previousPolls = polls;
    setPolls(p => p.filter(x => x._id !== id));
    setDeleting(id);

    try {
      await api.delete(`/polls/${id}`);
      toast.success('Poll deleted');
    } catch (err) {
      // Revert on error
      setPolls(previousPolls);
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const copyLink = useCallback(async (shareCode) => {
    const url = `${window.location.origin}/poll/${shareCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(shareCode);
    toast.success('Link copied!');
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const exportCsv = useCallback(async (pollId, pollTitle) => {
    setExporting(pollId);
    try {
      const res = await api.get(`/polls/${pollId}/export-csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `pollify-${pollTitle.replace(/\s+/g, '-').toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  }, []);

  // Apply filter and debounced search
  const filtered = useMemo(() => polls.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (debouncedSearch && !p.title.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
    return true;
  }), [polls, filter, debouncedSearch]);

  const counts = useMemo(() => FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? polls.length : polls.filter(p => p.status === f).length;
    return acc;
  }, {}), [polls]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl mb-1" style={{ color: 'var(--ink)' }}>My Polls</h1>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              {polls.length} poll{polls.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <Link to="/polls/create" className="btn btn-primary">
            <PlusCircle size={16} /> New Poll
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-faint)' }} />
            <input
              type="text"
              className="input-field pl-10 py-2.5 text-sm"
              placeholder="Search polls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl"
            style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={filter === f
                  ? { background: '#fff', color: 'var(--ink)', boxShadow: 'var(--shadow-sm)' }
                  : { color: 'var(--ink-muted)', background: 'transparent' }}>
                {f}
                {counts[f] > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                    style={{ background: filter === f ? 'var(--cream)' : 'var(--cream-dark)', color: 'var(--ink-muted)' }}>
                    {counts[f]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center py-20">
            <div className="empty-icon"><BarChart3 size={24} /></div>
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--ink)' }}>
              {polls.length === 0 ? 'No polls yet' : 'No polls match your filters'}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
              {polls.length === 0
                ? 'Create your first poll and start collecting responses.'
                : 'Try adjusting your search or filter.'}
            </p>
            {polls.length === 0 && (
              <Link to="/polls/create" className="btn btn-primary">
                <PlusCircle size={16} /> Create your first poll
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((poll, i) => (
              <motion.div key={poll._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} className="card card-hover">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Link to={`/polls/${poll._id}`}
                        className="font-medium text-base hover:underline truncate"
                        style={{ color: 'var(--ink)' }}>
                        {poll.title}
                      </Link>
                      <StatusTag status={poll.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: 'var(--ink-faint)' }}>
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {poll.totalResponses} responses
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> Created {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> Expires {format(new Date(poll.expiresAt), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => copyLink(poll.shareCode)} className="btn btn-secondary btn-sm">
                      {copied === poll.shareCode
                        ? <><CheckCheck size={13} style={{ color: 'var(--sage)' }} /> Copied</>
                        : <><Copy size={13} /> Copy link</>}
                    </button>

                    <Link to={`/polls/${poll._id}/analytics`} className="btn btn-secondary btn-sm">
                      <BarChart3 size={13} /> Analytics
                    </Link>

                    <button onClick={() => exportCsv(poll._id, poll.title)}
                      disabled={exporting === poll._id}
                      className="btn btn-secondary btn-sm" title="Export CSV">
                      {exporting === poll._id
                        ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2, borderColor: 'var(--ink-muted)', borderTopColor: 'transparent' }} />
                        : <Download size={13} />}
                    </button>

                    <a href={`/poll/${poll.shareCode}`} target="_blank" rel="noreferrer"
                      className="btn btn-ghost btn-sm">
                      <ExternalLink size={13} />
                    </a>

                    <button
                      onClick={() => setConfirm({ open: true, id: poll._id, title: poll.title })}
                      disabled={deleting === poll._id}
                      className="btn btn-danger btn-sm">
                      {deleting === poll._id
                        ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2, borderColor: 'var(--coral)', borderTopColor: 'transparent' }} />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </motion.div>

      <ConfirmDialog
        open={confirm.open}
        title={`Delete "${confirm.title}"?`}
        message="This cannot be undone. All responses will be permanently deleted."
        confirmLabel="Delete"
        confirmStyle="btn-danger"
        onConfirm={deletePoll}
        onCancel={() => setConfirm({ open: false })}
      />
    </div>
  );
}