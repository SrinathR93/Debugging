import { useState } from 'react';
import { useApp } from './context';
import { loginUser, registerUser } from './store';

export function AuthPage() {
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, showToast } = useApp();

  function handle(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError(''); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (mode === 'login') {
        const res = loginUser(form.email.trim(), form.password);
        if (res.error) { setError(res.error); setLoading(false); return; }
        login(res.user);
        showToast(`Welcome back, ${res.user.name}!`, 'success');
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
        const res = registerUser(form.name.trim(), form.email.trim(), form.password);
        if (res.error) { setError(res.error); setLoading(false); return; }
        login(res.user);
        showToast(`Welcome, ${res.user.name}! Account created.`, 'success');
      }
      setLoading(false);
    }, 400);
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚡</div>
            <div className="logo-big">CodePredict</div>
          </div>
          <p>Predict the output. Climb the leaderboard.</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 4, marginBottom: 24 }}>
          {['login', 'register'].map(m => (
            <button key={m} className={`btn ${mode === m ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, textTransform: 'capitalize' }} onClick={() => { setMode(m); setError(''); }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" name="name" placeholder="Alice Smith" value={form.name} onChange={handle} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} required />
          </div>

          {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>⚠ {error}</div>}

          <button className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <span className="spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> : mode === 'login' ? '→ Sign In' : '→ Create Account'}
          </button>
        </form>


      </div>
    </div>
  );
}
