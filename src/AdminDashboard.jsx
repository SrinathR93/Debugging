import { useState, useEffect } from 'react';
import { useApp } from './context';
import {
  getQuestions, addQuestion, updateQuestion, deleteQuestion,
  getCompetitions, addCompetition, updateCompetition, deleteCompetition,
  getUsers, getSubmissions, getLeaderboard, getCompetitionById,
  LANGUAGES, DIFFICULTIES, CATEGORIES, difficultyColor,
} from './store';
import { CodeBlock } from './CodeBlock';

const VIEWS = {
  DASHBOARD: 'dashboard',
  QUESTIONS: 'questions',
  QUESTION_FORM: 'question_form',
  COMPETITIONS: 'competitions',
  COMP_FORM: 'comp_form',
  PARTICIPANTS: 'participants',
  SUBMISSIONS: 'submissions',
  LEADERBOARD: 'leaderboard',
};

export function AdminDashboard() {
  const { logout } = useApp();
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [editTarget, setEditTarget] = useState(null);

  function nav(v, target = null) { setView(v); setEditTarget(target); }

  const sidebarItems = [
    { section: 'OVERVIEW', items: [{ id: VIEWS.DASHBOARD, label: 'Dashboard', icon: '📊' }] },
    { section: 'CONTENT', items: [{ id: VIEWS.QUESTIONS, label: 'Questions', icon: '📝' }, { id: VIEWS.COMPETITIONS, label: 'Competitions', icon: '🏆' }] },
    { section: 'ANALYTICS', items: [{ id: VIEWS.PARTICIPANTS, label: 'Participants', icon: '👥' }, { id: VIEWS.SUBMISSIONS, label: 'Submissions', icon: '📨' }, { id: VIEWS.LEADERBOARD, label: 'Leaderboard', icon: '🎖' }] },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ marginBottom: 8 }}>
          {sidebarItems.map(section => (
            <div key={section.section}>
              <div className="sidebar-section">{section.section}</div>
              {section.items.map(item => (
                <button key={item.id} className={`sidebar-link ${view === item.id || (view === VIEWS.QUESTION_FORM && item.id === VIEWS.QUESTIONS) || (view === VIEWS.COMP_FORM && item.id === VIEWS.COMPETITIONS) ? 'active' : ''}`}
                  onClick={() => nav(item.id)}>
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="divider" />
        <button className="sidebar-link" style={{ color: 'var(--danger)' }} onClick={logout}>
          <span>🚪</span> Logout
        </button>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {view === VIEWS.DASHBOARD && <AdminOverview onNav={nav} />}
        {view === VIEWS.QUESTIONS && <QuestionsView onNav={nav} />}
        {view === VIEWS.QUESTION_FORM && <QuestionForm onNav={nav} editTarget={editTarget} />}
        {view === VIEWS.COMPETITIONS && <CompetitionsView onNav={nav} />}
        {view === VIEWS.COMP_FORM && <CompetitionForm onNav={nav} editTarget={editTarget} />}
        {view === VIEWS.PARTICIPANTS && <ParticipantsView />}
        {view === VIEWS.SUBMISSIONS && <SubmissionsView />}
        {view === VIEWS.LEADERBOARD && <AdminLeaderboard />}
      </main>
    </div>
  );
}

// ===== ADMIN OVERVIEW =====
function AdminOverview({ onNav }) {
  const questions = getQuestions();
  const competitions = getCompetitions();
  const users = getUsers();
  const submissions = getSubmissions();

  const stats = [
    { label: 'Questions', value: questions.length, icon: '📝', color: 'var(--accent)', sub: `${questions.filter(q => q.enabled).length} active` },
    { label: 'Competitions', value: competitions.length, icon: '🏆', color: 'var(--accent2)', sub: `${competitions.filter(c => c.status === 'live').length} live` },
    { label: 'Participants', value: users.length, icon: '👥', color: 'var(--warning)', sub: 'registered' },
    { label: 'Submissions', value: submissions.length, icon: '📨', color: 'var(--success)', sub: `${submissions.filter(s => s.isCorrect).length} correct` },
  ];

  return (
    <div className="animate-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div><h1 className="section-title">Admin Dashboard</h1><div className="section-sub">Overview of your competition platform</div></div>
      </div>
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>⚡ Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => onNav(VIEWS.QUESTION_FORM)}>+ Add New Question</button>
            <button className="btn btn-outline" onClick={() => onNav(VIEWS.COMP_FORM)}>+ Create Competition</button>
            <button className="btn btn-ghost" onClick={() => onNav(VIEWS.PARTICIPANTS)}>View Participants</button>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🏆 Competitions</h3>
          {competitions.slice(0, 4).map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{c.title}</span>
              <span className={`badge ${c.status === 'live' ? 'badge-success' : c.status === 'upcoming' ? 'badge-warning' : 'badge-muted'}`}>{c.status}</span>
            </div>
          ))}
          {competitions.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No competitions yet</div>}
        </div>
      </div>
    </div>
  );
}

// ===== QUESTIONS VIEW =====
function QuestionsView({ onNav }) {
  const [questions, setQuestions] = useState(getQuestions());
  const [filter, setFilter] = useState({ lang: '', diff: '', search: '' });
  const { showToast } = useApp();

  function refresh() { setQuestions(getQuestions()); }

  function handleDelete(id) {
    deleteQuestion(id);
    refresh();
    showToast('Question deleted', 'info');
  }

  function handleToggle(id, enabled) {
    updateQuestion(id, { enabled: !enabled });
    refresh();
  }

  const filtered = questions.filter(q => {
    if (filter.lang && q.language !== filter.lang) return false;
    if (filter.diff && q.difficulty !== filter.diff) return false;
    if (filter.search && !q.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-in">
      <div className="section-header">
        <div><h1 className="section-title">Questions</h1><div className="section-sub">{questions.length} total questions</div></div>
        <button className="btn btn-primary" onClick={() => onNav(VIEWS.QUESTION_FORM)}>+ Add Question</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: 220 }} placeholder="🔍 Search questions..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
        <select className="form-input form-select" style={{ maxWidth: 160 }} value={filter.lang} onChange={e => setFilter(f => ({ ...f, lang: e.target.value }))}>
          <option value="">All Languages</option>
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="form-input form-select" style={{ maxWidth: 160 }} value={filter.diff} onChange={e => setFilter(f => ({ ...f, diff: e.target.value }))}>
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Language</th>
              <th>Difficulty</th>
              <th>Marks</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q, i) => (
              <tr key={q.id}>
                <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                <td style={{ fontWeight: 600, maxWidth: 200 }} className="truncate">{q.title}</td>
                <td><span className="badge badge-accent" style={{ textTransform: 'none' }}>{q.language}</span></td>
                <td><span className={`badge ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span></td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{q.marks}</td>
                <td><span className="tag">{q.category}</span></td>
                <td>
                  <label className="toggle">
                    <input type="checkbox" checked={q.enabled} onChange={() => handleToggle(q.id, q.enabled)} />
                    <span className="toggle-slider" />
                  </label>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => onNav(VIEWS.QUESTION_FORM, q)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state"><div className="empty-state-icon">📝</div><p>No questions found</p></div>}
      </div>
    </div>
  );
}

// ===== QUESTION FORM =====
function QuestionForm({ onNav, editTarget }) {
  const { showToast } = useApp();
  const isEdit = !!editTarget;
  const [form, setForm] = useState(editTarget ? { ...editTarget } : {
    title: '', language: 'python', code: '', answer: '', explanation: '', difficulty: 'easy', marks: 5, category: 'Loops',
  });
  const [preview, setPreview] = useState(false);

  function handle(e) { setForm(f => ({ ...f, [e.target.name]: e.target.name === 'marks' ? Number(e.target.value) : e.target.value })); }

  function submit(e) {
    e.preventDefault();
    if (!form.title || !form.code || !form.answer) { showToast('Fill required fields', 'error'); return; }
    if (isEdit) { updateQuestion(editTarget.id, form); showToast('Question updated!', 'success'); }
    else { addQuestion(form); showToast('Question added!', 'success'); }
    onNav(VIEWS.QUESTIONS);
  }

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav(VIEWS.QUESTIONS)} style={{ marginBottom: 8 }}>← Back to Questions</button>
          <h1 className="section-title">{isEdit ? 'Edit Question' : 'Add New Question'}</h1>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setPreview(!preview)}>
          {preview ? '✏ Edit' : '👁 Preview'}
        </button>
      </div>

      {preview ? (
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className={`badge ${difficultyColor(form.difficulty)}`}>{form.difficulty}</span>
            <span className="badge badge-accent">{form.marks} marks</span>
            <span className="tag">{form.category}</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{form.title || 'Question Title'}</h2>
          {form.code && <CodeBlock code={form.code} language={form.language} />}
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>CORRECT ANSWER (admin only)</div>
            <code style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{form.answer || '...'}</code>
          </div>
          {form.explanation && (
            <div className="explanation-box" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>💡 EXPLANATION</div>
              {form.explanation}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="grid-2" style={{ gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Basic Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input className="form-input" name="title" value={form.title} onChange={handle} placeholder="e.g. Loop Sum" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Language *</label>
                    <select className="form-input form-select" name="language" value={form.language} onChange={handle}>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Difficulty</label>
                      <select className="form-input form-select" name="difficulty" value={form.difficulty} onChange={handle}>
                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Marks</label>
                      <input className="form-input" name="marks" type="number" min="1" max="100" value={form.marks} onChange={handle} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-input form-select" name="category" value={form.category} onChange={handle}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Answer & Explanation</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Correct Output * <span style={{ color: 'var(--danger)', fontSize: 11 }}>(NEVER shown to participants)</span></label>
                    <textarea className="form-input form-textarea" name="answer" value={form.answer} onChange={handle} placeholder="Exact expected output..." rows={3} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Explanation</label>
                    <textarea className="form-input form-textarea" name="explanation" value={form.explanation} onChange={handle} placeholder="Explain why this is the output..." rows={4} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Code Snippet *</h3>
                <div className="form-group">
                  <textarea className="form-input form-textarea" name="code" value={form.code} onChange={handle}
                    placeholder="Paste your code here..." rows={16}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13, background: '#0d1117', color: 'var(--text-primary)' }}
                    required />
                </div>
                <div className="form-hint" style={{ marginTop: 6 }}>Write clean code with proper indentation</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => onNav(VIEWS.QUESTIONS)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg">{isEdit ? '💾 Update Question' : '+ Save Question'}</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ===== COMPETITIONS VIEW =====
function CompetitionsView({ onNav }) {
  const [competitions, setCompetitions] = useState(getCompetitions());
  const { showToast } = useApp();

  function refresh() { setCompetitions(getCompetitions()); }

  function handleDelete(id) {
    deleteCompetition(id);
    refresh();
    showToast('Competition deleted', 'info');
  }

  function handleStatus(id, status) {
    updateCompetition(id, { status });
    refresh();
    showToast(`Competition set to ${status}`, 'success');
  }

  return (
    <div className="animate-in">
      <div className="section-header">
        <div><h1 className="section-title">Competitions</h1><div className="section-sub">{competitions.length} total</div></div>
        <button className="btn btn-primary" onClick={() => onNav(VIEWS.COMP_FORM)}>+ Create Competition</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {competitions.map(c => (
          <div key={c.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700 }}>{c.title}</h3>
                  <span className={`badge ${c.status === 'live' ? 'badge-success' : c.status === 'upcoming' ? 'badge-warning' : 'badge-muted'}`}>{c.status}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{c.description}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>📝 {c.questions.length} questions</span>
                  <span>⏱ {c.duration} min</span>
                  <span>📅 {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select className="form-input form-select" style={{ width: 130, padding: '6px 10px', fontSize: 12 }}
                  value={c.status} onChange={e => handleStatus(c.id, e.target.value)}>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="ended">Ended</option>
                </select>
                <button className="btn btn-outline btn-sm" onClick={() => onNav(VIEWS.COMP_FORM, c)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {competitions.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <h3 style={{ marginBottom: 8 }}>No Competitions</h3>
            <p>Create your first competition to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== COMPETITION FORM =====
function CompetitionForm({ onNav, editTarget }) {
  const { showToast } = useApp();
  const isEdit = !!editTarget;
  const allQuestions = getQuestions().filter(q => q.enabled);
  const [form, setForm] = useState(editTarget ? { ...editTarget } : {
    title: '', description: '', duration: 30, questions: [], status: 'upcoming',
  });

  function handle(e) { setForm(f => ({ ...f, [e.target.name]: e.target.name === 'duration' ? Number(e.target.value) : e.target.value })); }

  function toggleQuestion(qid) {
    setForm(f => ({
      ...f,
      questions: f.questions.includes(qid) ? f.questions.filter(id => id !== qid) : [...f.questions, qid],
    }));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.title || form.questions.length === 0) { showToast('Add title and at least 1 question', 'error'); return; }
    if (isEdit) { updateCompetition(editTarget.id, form); showToast('Competition updated!', 'success'); }
    else { addCompetition(form); showToast('Competition created!', 'success'); }
    onNav(VIEWS.COMPETITIONS);
  }

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav(VIEWS.COMPETITIONS)} style={{ marginBottom: 8 }}>← Back</button>
          <h1 className="section-title">{isEdit ? 'Edit Competition' : 'Create Competition'}</h1>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Competition Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" name="title" value={form.title} onChange={handle} placeholder="e.g. Python Sprint" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" name="description" value={form.description} onChange={handle} placeholder="Brief description..." rows={3} />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input className="form-input" name="duration" type="number" min="5" max="180" value={form.duration} onChange={handle} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input form-select" name="status" value={form.status} onChange={handle}>
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700 }}>Select Questions</h3>
              <span className="badge badge-accent">{form.questions.length} selected</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {allQuestions.map(q => (
                <label key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: `1.5px solid ${form.questions.includes(q.id) ? 'var(--accent)' : 'var(--border)'}`, background: form.questions.includes(q.id) ? 'var(--accent-glow)' : 'var(--bg-input)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={form.questions.includes(q.id)} onChange={() => toggleQuestion(q.id)} style={{ accentColor: 'var(--accent)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{q.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                      <span className="badge badge-accent" style={{ fontSize: 10 }}>{q.language}</span>
                      <span className={`badge ${difficultyColor(q.difficulty)}`} style={{ fontSize: 10 }}>{q.difficulty}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.marks} pts</span>
                    </div>
                  </div>
                </label>
              ))}
              {allQuestions.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No enabled questions. Add questions first.</div>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => onNav(VIEWS.COMPETITIONS)}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg">{isEdit ? '💾 Update' : '🚀 Create Competition'}</button>
        </div>
      </form>
    </div>
  );
}

// ===== PARTICIPANTS VIEW =====
function ParticipantsView() {
  const users = getUsers();
  const submissions = getSubmissions();

  return (
    <div className="animate-in">
      <div className="section-header">
        <div><h1 className="section-title">Participants</h1><div className="section-sub">{users.length} registered</div></div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Submissions</th>
              <th>Correct</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const userSubs = submissions.filter(s => s.userId === u.id);
              const correct = userSubs.filter(s => s.isCorrect).length;
              return (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{u.name[0].toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{userSubs.length}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{correct}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.joinedAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && <div className="empty-state"><div className="empty-state-icon">👥</div><p>No participants yet</p></div>}
      </div>
    </div>
  );
}

// ===== SUBMISSIONS VIEW =====
function SubmissionsView() {
  const submissions = getSubmissions();
  const users = getUsers();
  const questions = getQuestions();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.isCorrect === (filter === 'correct'));

  return (
    <div className="animate-in">
      <div className="section-header">
        <div><h1 className="section-title">Submissions</h1><div className="section-sub">{submissions.length} total</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['all', 'All'], ['correct', '✅ Correct'], ['wrong', '❌ Wrong']].map(([v, l]) => (
            <button key={v} className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Question</th>
              <th>Answer</th>
              <th>Result</th>
              <th>Marks</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice().reverse().map(s => {
              const user = users.find(u => u.id === s.userId);
              const q = questions.find(q => q.id === s.questionId);
              return (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{user?.name || 'Unknown'}</td>
                  <td style={{ fontSize: 13, maxWidth: 160 }} className="truncate">{q?.title || s.questionId}</td>
                  <td><code>{s.userAnswer}</code></td>
                  <td>{s.isCorrect ? <span className="badge badge-success">✓ Correct</span> : <span className="badge badge-danger">✗ Wrong</span>}</td>
                  <td style={{ fontWeight: 700, color: s.isCorrect ? 'var(--success)' : 'var(--danger)' }}>{s.marks}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(s.submittedAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state"><div className="empty-state-icon">📨</div><p>No submissions yet</p></div>}
      </div>
    </div>
  );
}

// ===== ADMIN LEADERBOARD =====
function AdminLeaderboard() {
  const competitions = getCompetitions();
  const [selectedId, setSelectedId] = useState(competitions[0]?.id);
  const board = selectedId ? getLeaderboard(selectedId) : [];

  return (
    <div className="animate-in">
      <div className="section-header">
        <div><h1 className="section-title">Leaderboard</h1></div>
        <select className="form-input form-select" style={{ maxWidth: 280 }} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          {competitions.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Participant</th>
              <th>Score</th>
              <th>Correct</th>
              <th>Last Submission</th>
            </tr>
          </thead>
          <tbody>
            {board.map(p => (
              <tr key={p.userId} className={p.rank <= 3 ? `top-${p.rank}` : ''}>
                <td>{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{p.name[0]}</div>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 18 }}>{p.score}</td>
                <td style={{ color: 'var(--success)', fontWeight: 700 }}>{p.correct}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.lastTime ? new Date(p.lastTime).toLocaleTimeString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {board.length === 0 && <div className="empty-state"><div className="empty-state-icon">🎖</div><p>No submissions for this competition</p></div>}
      </div>
    </div>
  );
}
