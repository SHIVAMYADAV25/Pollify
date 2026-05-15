import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusCircle, BarChart3, ExternalLink, ListChecks, Users,
  TrendingUp, ArrowRight, Clock, Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { connectSocket, leaveCreatorRoom } from '../../lib/socket';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07 } }),
};

const StatusTag = ({ status }) => {
  const map = { active: 'tag-active', expired: 'tag-expired', published: 'tag-published', draft: 'tag-draft' };
  return <span className={`tag ${map[status] || 'tag-draft'}`}>{status}</span>;
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentPolls, setRecentPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/polls/dashboard');
      setStats(res.data.stats);
      setRecentPolls(res.data.recentPolls || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const socket = connectSocket();
    const userId = user?._id;

    if (userId) socket.emit('join:creator', userId);

    const handleResponseNew = () => {
      setLiveCount(c => c + 1);
      loadData();
    };

    const handleMilestone = ({ milestone, pollTitle }) => {
      toast.success(`🎉 "${pollTitle}" just hit ${milestone} responses!`, { duration: 6000 });
    };

    socket.on('response:new', handleResponseNew);
    socket.on('milestone:reached', handleMilestone);

    // Proper cleanup on unmount — leave the creator room
    return () => {
      socket.off('response:new', handleResponseNew);
      socket.off('milestone:reached', handleMilestone);
      if (userId) leaveCreatorRoom(userId);
    };
  }, [user?._id, loadData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Polls', value: stats?.totalPolls || 0, icon: ListChecks, color: 'var(--sage)', bg: 'var(--sage-light)' },
    { label: 'Active Polls', value: stats?.activePolls || 0, icon: TrendingUp, color: 'var(--sky)', bg: 'var(--sky-light)' },
    { label: 'Total Responses', value: stats?.totalResponses || 0, icon: Users, color: 'var(--coral)', bg: 'var(--coral-light)' },
    { label: 'Published', value: stats?.publishedPolls || 0, icon: BarChart3, color: 'var(--gold)', bg: 'var(--gold-light)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="font-serif text-3xl mb-1" style={{ color: 'var(--ink)' }}>
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Here's what's happening with your polls.</p>
        </div>
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <span className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
              style={{ background: 'var(--sage-light)', color: 'var(--sage)', border: '1px solid rgba(74,124,89,0.2)' }}>
              <span className="live-dot" />
              {liveCount} new response{liveCount > 1 ? 's' : ''}
            </span>
          )}
          <Link to="/polls/create" className="btn btn-primary">
            <PlusCircle size={16} /> New Poll
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}
            className="stat-card card-hover">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: s.bg }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div className="text-3xl font-semibold mb-1 font-serif" style={{ color: 'var(--ink)' }}>
              {s.value.toLocaleString()}
            </div>
            <div className="text-sm" style={{ color: 'var(--ink-muted)' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {stats?.activePolls > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="rounded-2xl p-4 mb-8 flex items-center gap-3"
          style={{ background: 'var(--sage-light)', border: '1px solid rgba(74,124,89,0.2)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--sage)' }}>
            <Zap size={16} color="#fff" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--sage)' }}>
              {stats.activePolls} poll{stats.activePolls > 1 ? 's' : ''} currently active
            </p>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Responses are being collected in real time</p>
          </div>
          <Link to="/polls" className="btn btn-sm" style={{ background: 'var(--sage)', color: '#fff', border: 'none' }}>
            View polls
          </Link>
        </motion.div>
      )}

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--ink)' }}>Recent Polls</h2>
          <Link to="/polls" className="flex items-center gap-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentPolls.length === 0 ? (
          <div className="card text-center py-16">
            <div className="empty-icon"><ListChecks size={24} /></div>
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--ink)' }}>No polls yet</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
              Create your first poll and start collecting responses.
            </p>
            <Link to="/polls/create" className="btn btn-primary">
              <PlusCircle size={16} /> Create Poll
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPolls.map((poll, i) => (
              <motion.div key={poll._id} variants={fadeUp} initial="hidden" animate="visible"
                custom={5 + i * 0.1}
                className="card card-hover flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--cream)' }}>
                    <BarChart3 size={18} style={{ color: 'var(--ink-muted)' }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate max-w-xs mb-1" style={{ color: 'var(--ink)' }}>
                      {poll.title}
                    </h3>
                    <div className="flex items-center gap-2.5">
                      <StatusTag status={poll.status} />
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--ink-faint)' }}>
                        <Clock size={11} />
                        {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{poll.totalResponses}</div>
                    <div className="text-xs" style={{ color: 'var(--ink-faint)' }}>responses</div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/polls/${poll._id}/analytics`} className="btn btn-secondary btn-sm">
                      <BarChart3 size={13} /> Analytics
                    </Link>
                    <a href={`/poll/${poll.shareCode}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}