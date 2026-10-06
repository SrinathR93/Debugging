import { useState, useEffect } from 'react';
import { getLeaderboard, getCompetitions, getCompetitionById } from './store';

export function LeaderboardPage({ competitionId: initialCompId }) {
  const [competitions] = useState(getCompetitions());
  const [selectedId, setSelectedId] = useState(initialCompId || (getCompetitions()[0]?.id));
  const [board, setBoard] = useState([]);

  useEffect(() => {
    if (selectedId) setBoard(getLeaderboard(selectedId));
  }, [selectedId]);

  const comp = getCompetitionById(selectedId);

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--bg-primary)', padding: '32px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <h1 style={{ fontSize: 32, fontWeight: 900 }}>Leaderboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Rankings are sorted by score, then completion time</p>
        </div>

        {/* Competition selector */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
          {competitions.map(c => (
            <button key={c.id} className={`btn ${selectedId === c.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSelectedId(c.id)}>
              {c.title}
            </button>
          ))}
        </div>

        {comp && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontWeight: 700 }}>{comp.title}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{comp.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{board.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Participants</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>{comp.questions.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Questions</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 podium */}
        {board.length >= 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, marginBottom: 32 }}>
            {[board[1], board[0], board[2]].map((p, i) => {
              const heights = ['140px', '180px', '120px'];
              const medals = ['🥈', '🥇', '🥉'];
              const colors = ['var(--silver)', 'var(--gold)', 'var(--bronze)'];
              const rankNums = [2, 1, 3];
              if (!p) return null;
              return (
                <div key={p.userId} style={{ textAlign: 'center', flex: 1, maxWidth: 180 }}>
                  <div className="avatar" style={{ margin: '0 auto 8px', width: 52, height: 52, fontSize: 20, background: `linear-gradient(135deg, ${colors[i]}, ${colors[i]}aa)` }}>{(p.name || 'U')[0].toUpperCase()}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: colors[i] }}>{medals[i]}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{p.name}</div>
                  <div style={{ height: heights[i], background: `linear-gradient(180deg, ${colors[i]}22, ${colors[i]}11)`, border: `2px solid ${colors[i]}44`, borderBottom: 'none', borderRadius: '8px 8px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: colors[i] }}>{p.score}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>pts</div>
                    <div style={{ fontSize: 11, color: 'var(--success)' }}>✓ {p.correct}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full leaderboard table */}
        {board.length > 0 ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Participant</th>
                  <th>Score</th>
                  <th>Correct</th>
                  <th>Completion Time</th>
                </tr>
              </thead>
              <tbody>
                {board.map((p) => (
                  <tr key={p.userId} className={p.rank <= 3 ? `top-${p.rank}` : ''}>
                    <td>
                      {p.rank === 1 ? <span className="rank-medal">🥇</span>
                        : p.rank === 2 ? <span className="rank-medal">🥈</span>
                        : p.rank === 3 ? <span className="rank-medal">🥉</span>
                        : <span className="rank-num">#{p.rank}</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{(p.name || 'U')[0].toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent)' }}>{p.score}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> pts</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>{p.correct}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> correct</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {p.lastTime ? new Date(p.lastTime).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3 style={{ marginBottom: 8 }}>No Submissions Yet</h3>
            <p>Be the first to participate in this competition!</p>
          </div>
        )}
      </div>
    </div>
  );
}
