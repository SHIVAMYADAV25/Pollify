import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BarChart3, Share2, Shield, Clock, Users, CheckCircle,
  TrendingUp, Zap,
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    icon: Zap, title: 'Live Analytics',
    desc: 'Real-time response tracking with WebSocket-powered updates as answers come in.',
    iconClass: 'feature-icon-sage',
  },
  {
    icon: Share2, title: 'Instant Sharing',
    desc: 'Every poll gets a unique link. Share anywhere, collect responses from anyone.',
    iconClass: 'feature-icon-coral',
  },
  {
    icon: Shield, title: 'Auth & Anonymous',
    desc: 'Support both authenticated and anonymous response modes per poll.',
    iconClass: 'feature-icon-sky',
  },
  {
    icon: Clock, title: 'Expiry Control',
    desc: 'Set precise expiry times. Polls auto-close and protect against late submissions.',
    iconClass: 'feature-icon-gold',
  },
  {
    icon: BarChart3, title: 'Rich Dashboards',
    desc: 'Option counts, participation trends, completion rates, and more.',
    iconClass: 'feature-icon-sage',
  },
  {
    icon: Users, title: 'Publish Results',
    desc: 'One click to make final results publicly visible on the same poll link.',
    iconClass: 'feature-icon-coral',
  },
];

const steps = [
  { num: '01', title: 'Create Your Poll', desc: 'Add questions, set options, expiry and configure settings.' },
  { num: '02', title: 'Share the Link', desc: 'Copy your unique link and share it with your audience.' },
  { num: '03', title: 'Watch Responses', desc: 'Live dashboard updates in real-time as responses arrive.' },
  { num: '04', title: 'Publish Results', desc: 'Share final results publicly once polling ends.' },
];

const mockOptions = [
  { label: 'Real-time analytics', pct: 42, color: 'var(--sage)' },
  { label: 'Anonymous polls', pct: 28, color: 'var(--coral)' },
  { label: 'Result publishing', pct: 30, color: 'var(--gold)' },
];

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div style={{ background: 'var(--parchment)' }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Blobs */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 480, height: 480,
            background: 'var(--sage-light)',
            top: -120, left: -120,
            filter: 'blur(64px)', opacity: 0.8,
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 360, height: 360,
            background: 'var(--gold-light)',
            bottom: -80, right: -80,
            filter: 'blur(64px)', opacity: 0.8,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div>
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                <span
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-6"
                  style={{
                    background: 'var(--sage-light)',
                    color: 'var(--sage)',
                    border: '1px solid rgba(74,124,89,0.2)',
                  }}
                >
                  <span className="live-dot" />
                  Real-time polling platform
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp} initial="hidden" animate="visible" custom={1}
                className="font-serif leading-tight mb-6"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', color: 'var(--ink)', lineHeight: 1.1 }}
              >
                Create polls that{' '}
                <em style={{ color: 'var(--sage)', fontStyle: 'italic' }}>actually work.</em>
              </motion.h1>

              <motion.p
                variants={fadeUp} initial="hidden" animate="visible" custom={2}
                className="text-lg leading-relaxed mb-10 max-w-lg"
                style={{ color: 'var(--ink-muted)' }}
              >
                Build powerful polls, share them instantly, and watch responses roll in — live. From simple questions to full analytics dashboards.
              </motion.p>

              <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={3}
                className="flex flex-col sm:flex-row gap-3"
              >
                {isAuthenticated ? (
                  <Link to="/polls/create" className="btn btn-primary btn-lg">
                    Create a Poll <ArrowRight size={18} />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-primary btn-lg">
                      Start for free <ArrowRight size={18} />
                    </Link>
                    <Link to="/login" className="btn btn-secondary btn-lg">
                      Sign in
                    </Link>
                  </>
                )}
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={4}
                className="mt-10 flex flex-wrap gap-5"
              >
                {['No credit card', 'Anonymous or authenticated', 'Live updates'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--ink-muted)' }}>
                    <CheckCircle size={14} style={{ color: 'var(--sage)' }} />
                    {t}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right — mock poll card */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={5}
              className="relative"
            >
              <div
                className="rounded-2xl p-6 relative"
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {/* Window dots */}
                <div className="flex items-center gap-1.5 mb-5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--coral-mid)' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--gold-mid)' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--sage-mid)' }} />
                  <div className="flex-1 flex justify-end">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--sage)' }}>
                      <span className="live-dot" /> Live
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--ink)' }}>
                  Which feature do you use most?
                </h3>
                <p className="text-xs mb-5" style={{ color: 'var(--ink-muted)' }}>
                  47 responses · Expires in 2h
                </p>

                {mockOptions.map((o, i) => (
                  <div key={o.label} className="mb-3.5">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{ color: 'var(--ink-light)' }}>{o.label}</span>
                      <span className="font-mono text-xs font-medium" style={{ color: o.color }}>{o.pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${o.pct}%` }}
                        transition={{ duration: 1.2, delay: 0.8 + i * 0.15, ease: 'easeOut' }}
                        style={{ background: o.color }}
                      />
                    </div>
                  </div>
                ))}

                {/* Live response badge */}
                <div
                  className="mt-5 flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'var(--sage-light)', border: '1px solid rgba(74,124,89,0.15)' }}
                >
                  <span className="text-xs font-medium" style={{ color: 'var(--sage)' }}>New response</span>
                  <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>just now</span>
                </div>
              </div>

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="absolute -right-6 -bottom-6 rounded-2xl px-4 py-3 hidden lg:block"
                style={{
                  background: 'var(--cream)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--sage-light)' }}
                  >
                    <TrendingUp size={16} style={{ color: 'var(--sage)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>+12 responses</p>
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>in the last hour</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--parchment)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            <h2 className="font-serif mb-4" style={{ fontSize: '2.5rem', color: 'var(--ink)' }}>
              Everything you need
            </h2>
            <p className="text-lg" style={{ color: 'var(--ink-muted)' }}>
              Built for creators who want insights, not headaches.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.05}
                className="card card-hover"
              >
                <div className={`feature-icon ${f.iconClass} mb-4`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--ink)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--cream)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            <h2 className="font-serif mb-4" style={{ fontSize: '2.5rem', color: 'var(--ink)' }}>
              Four steps to insight
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.1}
                className="relative"
              >
                <div
                  className="font-serif text-7xl leading-none mb-4"
                  style={{ color: 'rgba(74,124,89,0.12)' }}
                >
                  {s.num}
                </div>
                <h3 className="font-semibold text-base mb-2 -mt-2" style={{ color: 'var(--ink)' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{s.desc}</p>
                {i < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-8 left-full w-8"
                    style={{ color: 'var(--ink-faint)' }}
                  >
                    <ArrowRight size={16} style={{ margin: '0 auto' }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--parchment)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="rounded-3xl p-12 relative overflow-hidden"
            style={{ background: 'var(--sage)', boxShadow: '0 20px 60px rgba(74,124,89,0.25)' }}
          >
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 300, height: 300,
                background: 'rgba(255,255,255,0.08)',
                top: -80, right: -80,
                borderRadius: '50%',
              }}
            />
            <div className="relative z-10">
              <CheckCircle size={36} className="mx-auto mb-5" color="rgba(255,255,255,0.8)" />
              <h2 className="font-serif text-3xl sm:text-4xl mb-4" style={{ color: '#fff' }}>
                Ready to collect insights?
              </h2>
              <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Create your first poll in under 2 minutes. No credit card required.
              </p>
              <Link
                to={isAuthenticated ? '/polls/create' : '/register'}
                className="btn btn-lg inline-flex"
                style={{ background: '#fff', color: 'var(--sage)', border: 'none' }}
              >
                {isAuthenticated ? 'Create a Poll' : 'Get started free'}
                <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}