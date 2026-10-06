import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context';
import { AuthPage } from './AuthPage';
import { Navbar } from './Navbar';
import { ParticipantDashboard } from './ParticipantDashboard';
import { CompetitionRoom } from './CompetitionRoom';
import { LeaderboardPage } from './LeaderboardPage';
import { AdminDashboard } from './AdminDashboard';

function Toast() {
  const { toast } = useApp();
  if (!toast.length) return null;
  return (
    <div className="toast-container">
      {toast.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function AppInner() {
  const { user } = useApp();
  const [page, setPage] = useState('home');
  const [activeComp, setActiveComp] = useState(null);
  const [leaderboardCompId, setLeaderboardCompId] = useState(null);

  if (!user) return <AuthPage />;

  // Admin gets their own dashboard
  if (user.role === 'admin') {
    return (
      <>
        <Navbar page={page} onNavigate={setPage} />
        <AdminDashboard />
        <Toast />
      </>
    );
  }

  // Participant flow
  function handleJoin(comp) {
    if (comp.status === 'ended') {
      setLeaderboardCompId(comp.id);
      setPage('leaderboard');
    } else {
      setActiveComp(comp);
      setPage('competition');
    }
  }

  function handleFinish(comp) {
    setLeaderboardCompId(comp.id);
    setPage('leaderboard');
    setActiveComp(null);
  }

  return (
    <>
      <Navbar page={page} onNavigate={(p) => { setPage(p); setActiveComp(null); }} />
      {page === 'home' && <ParticipantDashboard onJoin={handleJoin} />}
      {page === 'competition' && activeComp && (
        <CompetitionRoom
          competition={activeComp}
          onFinish={handleFinish}
          onBack={() => { setPage('home'); setActiveComp(null); }}
        />
      )}
      {page === 'leaderboard' && <LeaderboardPage competitionId={leaderboardCompId} />}
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
