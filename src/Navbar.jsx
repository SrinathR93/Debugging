import { useApp } from './context';

export function Navbar({ page, onNavigate }) {
  const { user, logout } = useApp();
  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <nav className="navbar">
      <div className="container">
        {/* Brand */}
        <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => onNavigate('home')}>
          <div className="logo-icon">⚡</div>
          CodePredict
          {isAdmin && <span className="badge badge-warning" style={{ marginLeft: 4, fontSize: 10 }}>ADMIN</span>}
        </div>

        {/* Nav */}
        {!isAdmin && (
          <div className="navbar-nav">
            <button className={`nav-link ${page === 'home' ? 'active' : ''}`} onClick={() => onNavigate('home')}>Dashboard</button>
            <button className={`nav-link ${page === 'leaderboard' ? 'active' : ''}`} onClick={() => onNavigate('leaderboard')}>🏆 Leaderboard</button>
          </div>
        )}

        {/* User */}
        <div className="nav-user">
          <div className="avatar">{user.name[0].toUpperCase()}</div>
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{isAdmin ? 'Administrator' : 'Participant'}</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={logout} style={{ marginLeft: 4 }}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
