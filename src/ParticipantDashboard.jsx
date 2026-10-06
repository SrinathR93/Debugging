import { useState, useEffect } from 'react';
import { useApp } from './context';
import { getCompetitions } from './store';

export function ParticipantDashboard({ onJoin }) {
  const { user } = useApp();
  const [competitions, setCompetitions] = useState([]);

  useEffect(() => { setCompetitions(getCompetitions()); }, []);

  const live = competitions.filter(c => c.status === 'live');
  const upcoming = competitions.filter(c => c.status === 'upcoming');
  const ended = competitions.filter(c => c.status === 'ended');

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <div style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(108,99,255,0.1) 0%, transparent 60%), var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div className="avatar" style={{ width: 52, height: 52, fontSize: 20 }}>{user.name[0].toUpperCase()}</div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Welcome back, {user.name}! 👋</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Ready to predict some outputs?</p>
            </div>
          </div>
          <div className="grid-4" style={{ marginTop: 24 }}>
            {[
              { label: 'Live Now', value: live.length, color: 'var(--success)', icon: '🔴' },
              { label: 'Upcoming', value: upcoming.length, color: 'var(--warning)', icon: '⏰' },
              { label: 'Ended', value: ended.length, color: 'var(--text-muted)', icon: '✅' },
              { label: 'Total', value: competitions.length, color: 'var(--accent)', icon: '🏆' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>{s.icon}</div>
                <div className="stat-value" style={{ color: s.color, fontSize: 28 }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container section">
        {/* Live Competitions */}
        {live.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="comp-status-dot comp-status-live" />
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Live Competitions</h2>
            </div>
            <div className="grid-2" style={{ gap: 16 }}>
              {live.map(c => <CompCard key={c.id} comp={c} onJoin={onJoin} />)}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="comp-status-dot comp-status-upcoming" />
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Upcoming Competitions</h2>
            </div>
            <div className="grid-2" style={{ gap: 16 }}>
              {upcoming.map(c => <CompCard key={c.id} comp={c} onJoin={onJoin} />)}
            </div>
          </div>
        )}

        {/* Ended */}
        {ended.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>Past Competitions</h2>
            <div className="grid-2" style={{ gap: 16 }}>
              {ended.map(c => <CompCard key={c.id} comp={c} onJoin={onJoin} />)}
            </div>
          </div>
        )}

        {competitions.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <h3 style={{ marginBottom: 8 }}>No Competitions Yet</h3>
            <p>Check back soon! Competitions will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CompCard({ comp, onJoin }) {
  const statusMap = { live: { label: 'LIVE', cls: 'badge-success', dot: 'comp-status-live' }, upcoming: { label: 'UPCOMING', cls: 'badge-warning', dot: 'comp-status-upcoming' }, ended: { label: 'ENDED', cls: 'badge-muted', dot: 'comp-status-ended' } };
  const s = statusMap[comp.status] || statusMap.ended;
  const canJoin = comp.status === 'live';
  const canView = comp.status === 'ended';

  return (
    <div className="comp-card" onClick={() => (canJoin || canView) && onJoin(comp)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div className={`comp-status-dot ${s.dot}`} />
            <span className={`badge ${s.cls}`}>{s.label}</span>
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{comp.title}</h3>
        </div>
        <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{comp.duration}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>MIN</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>{comp.description}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📝 {comp.questions.length} questions</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏱ {comp.duration} min</span>
        </div>
        {canJoin && (
          <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); onJoin(comp); }}>
            Join Now →
          </button>
        )}
        {canView && (
          <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); onJoin(comp); }}>
            View Results
          </button>
        )}
      </div>
    </div>
  );
}
