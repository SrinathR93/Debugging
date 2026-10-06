import { useState, useEffect, useRef } from 'react';
import { useApp } from './context';
import {
  getQuestionSafe,
  submitAnswer,
  getUserCompResult,
  formatTime,
  difficultyColor,
  shuffleForUser,
  recordTabSwitch,
  getTabSwitches,
} from './store';
import { CodeBlock } from './CodeBlock';

const STATES = { INTRO: 'intro', PLAYING: 'playing', FINISHED: 'finished' };

export function CompetitionRoom({ competition, onFinish, onBack }) {
  const { user, showToast } = useApp();
  const comp = competition;
  const totalSeconds = comp.duration * 60;

  const [phase, setPhase] = useState(STATES.INTRO);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // qid -> { text, submitted, result }
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [tabSwitches, setTabSwitches] = useState(() => getTabSwitches(user?.id, comp.id));
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // Load questions async and shuffle deterministically for this specific user
    Promise.all(comp.questions.map(id => getQuestionSafe(id)))
      .then(qs => {
        const valid = qs.filter(Boolean);
        const shuffled = shuffleForUser(valid, user?.id || 'guest');
        setQuestions(shuffled);
      });
  }, [comp, user]);

  // Tab switch detection (Anti-cheat)
  useEffect(() => {
    if (phase !== STATES.PLAYING) return;

    function handleVisibility() {
      if (document.hidden) {
        const count = recordTabSwitch(user?.id, comp.id);
        setTabSwitches(count);
        showToast(`⚠️ Warning! Tab switch detected (${count}x)! This will be recorded on the leaderboard.`, 'error');
      }
    }

    function handleWindowBlur() {
      const count = recordTabSwitch(user?.id, comp.id);
      setTabSwitches(count);
      showToast(`⚠️ Warning! Window lost focus (${count}x)! Recorded on leaderboard.`, 'error');
    }

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [phase, user, comp.id, showToast]);

  function startCompetition() {
    setPhase(STATES.PLAYING);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase(STATES.FINISHED);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function finishCompetition() {
    clearInterval(timerRef.current);
    setPhase(STATES.FINISHED);
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  if (phase === STATES.INTRO) return <IntroScreen comp={comp} questions={questions} onStart={startCompetition} onBack={onBack} />;
  if (phase === STATES.FINISHED) return <ResultsScreen comp={comp} userId={user.id} onBack={onBack} onLeaderboard={() => onFinish(comp)} />;

  const pct = (timeLeft / totalSeconds) * 100;
  const timerClass = timeLeft < 60 ? 'urgent' : timeLeft < 180 ? 'warning' : 'normal';
  const q = questions[currentIdx];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        background: 'var(--bg-primary)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        showToast('⚠️ Right-click context menu is disabled in test mode!', 'error');
      }}
      onCopy={(e) => {
        e.preventDefault();
        showToast('⚠️ Copying is disabled in test mode!', 'error');
      }}
    >
      {/* Timer Bar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{comp.title}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {Object.keys(answers).length}/{questions.length} answered
              </div>
              {tabSwitches > 0 ? (
                <span className="badge badge-danger" style={{ fontWeight: 700 }} title="Anti-cheat: Tab switch detected">
                  ⚠️ {tabSwitches} Tab Switch{tabSwitches > 1 ? 'es' : ''}
                </span>
              ) : (
                <span className="badge badge-success" title="Anti-cheat: No tab switches">
                  ✓ Clean Tab
                </span>
              )}
              <div className={`timer-display ${timerClass}`} style={{ fontSize: 22, fontFamily: 'var(--font-mono)' }}>
                ⏱ {formatTime(timeLeft)}
              </div>
              <button className="btn btn-danger btn-sm" onClick={finishCompetition}>Finish</button>
            </div>
          </div>
          <div className="progress-bar">
            <div className={`progress-fill ${timerClass}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
        {/* Main question area */}
        <div>
          {q ? (
            <QuestionPanel
              key={q.id}
              question={q}
              idx={currentIdx}
              total={questions.length}
              existingAnswer={answers[q.id]}
              userId={user.id}
              competitionId={comp.id}
              onAnswered={(result) => {
                setAnswers(prev => ({ ...prev, [q.id]: result }));
                showToast(result.isCorrect ? '✅ Correct! +' + result.marks + ' marks' : '❌ Wrong answer', result.isCorrect ? 'success' : 'error');
              }}
              onNext={() => currentIdx < questions.length - 1 && setCurrentIdx(currentIdx + 1)}
              onPrev={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)}
            />
          ) : (
            <div className="loading"><div className="loading-spinner" /></div>
          )}
        </div>

        {/* Sidebar - Question nav */}
        <div style={{ position: 'sticky', top: 100 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '1px' }}>QUESTIONS</div>
            <div className="q-nav">
              {questions.map((q, i) => {
                const ans = answers[q.id];
                let cls = 'q-nav-btn';
                if (i === currentIdx) cls += ' current';
                else if (ans?.submitted) cls += ' answered';
                return (
                  <button key={q.id} className={cls} onClick={() => setCurrentIdx(i)} title={q.title}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--accent-glow)', border: '1.5px solid var(--accent)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Current</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--success-glow)', border: '1.5px solid var(--success)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Answered</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--bg-input)', border: '1.5px solid var(--border)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Unanswered</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>PROGRESS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Answered</span>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>{Object.keys(answers).length}/{questions.length}</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 12 }}>
              <div className="progress-fill" style={{ width: `${(Object.keys(answers).length / (questions.length || 1)) * 100}%`, transition: 'width 0.5s ease' }} />
            </div>
            <button className="btn btn-danger w-full" style={{ marginTop: 4 }} onClick={finishCompetition}>
              Submit All & Finish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntroScreen({ comp, questions, onStart, onBack }) {
  const maxScore = questions.reduce((acc, q) => acc + (q.marks || 0), 0);
  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at center, rgba(108,99,255,0.08) 0%, transparent 60%), var(--bg-primary)' }}>
      <div className="card" style={{ maxWidth: 560, width: '100%', margin: 24, textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⚡</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{comp.title}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>{comp.description}</p>
        <div className="grid-3" style={{ marginBottom: 32 }}>
          {[
            { icon: '📝', label: 'Questions', value: questions.length },
            { icon: '⏱', label: 'Duration', value: `${comp.duration} min` },
            { icon: '🏆', label: 'Max Score', value: `${maxScore} pts` },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: 24 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>📋 Instructions</div>
            <ul style={{ paddingLeft: 16, lineHeight: 2, fontSize: 13 }}>
              <li>Read each code snippet carefully</li>
              <li>Type <b>exactly</b> what you think the program will output</li>
              <li>Each question shows marks and difficulty</li>
              <li>Submit your answer before time runs out</li>
              <li>You can navigate between questions freely</li>
            </ul>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onBack}>← Back</button>
          <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={onStart}>🚀 Start Competition</button>
        </div>
      </div>
    </div>
  );
}

function QuestionPanel({ question: q, idx, total, existingAnswer, userId, competitionId, onAnswered, onNext, onPrev }) {
  const [input, setInput] = useState(existingAnswer?.userAnswer || '');
  const [result, setResult] = useState(existingAnswer?.submitted ? existingAnswer : null);
  const [submitting, setSubmitting] = useState(false);
  const submitted = !!result;

  async function handleSubmit() {
    if (!input.trim() || submitting || submitted) return;
    setSubmitting(true);
    const res = await submitAnswer(userId, competitionId, q.id, input.trim());
    setResult(res);
    onAnswered({ ...res, userAnswer: input.trim(), submitted: true });
    setSubmitting(false);
  }

  function handleKeyDown(e) {
    if (e.ctrlKey && e.key === 'Enter') handleSubmit();
  }

  return (
    <div className="fade-in">
      {/* Question header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 13 }}>Q{idx + 1} of {total}</span>
          <span className={`badge ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
          <span className="badge badge-accent">{q.marks} marks</span>
          <span className="tag">{q.category}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={onPrev} disabled={idx === 0}>← Prev</button>
          <button className="btn btn-outline btn-sm" onClick={onNext} disabled={idx === total - 1}>Next →</button>
        </div>
      </div>

      {/* Title */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{q.title}</h2>

      {/* Code */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '1px' }}>📌 CODE</div>
        <CodeBlock code={q.code} language={q.language} />
      </div>

      {/* Answer input */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
          <span>💬 YOUR ANSWER</span>
          <span style={{ fontWeight: 400, fontStyle: 'italic' }}>Ctrl+Enter to submit</span>
        </div>
        <textarea
          className={`answer-input ${result ? (result.isCorrect ? 'correct' : 'wrong') : ''}`}
          placeholder={`Type the exact output here...\n(Include newlines if there are multiple lines of output)`}
          value={input}
          onChange={e => !submitted && setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={e => {
            e.preventDefault();
            alert('⚠️ Pasting is disabled in test mode! Please type your answer manually.');
          }}
          onCopy={e => e.preventDefault()}
          onCut={e => e.preventDefault()}
          readOnly={submitted}
          rows={3}
        />
      </div>

      {/* Submit button */}
      {!submitted && (
        <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={!input.trim() || submitting} style={{ width: '100%', marginBottom: 16 }}>
          {submitting ? '⏳ Checking...' : '✓ Submit Answer'}
        </button>
      )}

      {/* Result feedback */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'slideUp 0.3s ease' }}>
          {result.isCorrect ? (
            <div className="result-correct">
              <span style={{ fontSize: 24 }}>🎉</span>
              <div>
                <div style={{ fontWeight: 700 }}>Correct! +{result.marks} marks</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Great job predicting the output!</div>
              </div>
            </div>
          ) : (
            <div className="result-wrong">
              <span style={{ fontSize: 24 }}>❌</span>
              <div>
                <div style={{ fontWeight: 700 }}>Wrong answer</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Correct output: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{result.correctAnswer}</code>
                </div>
              </div>
            </div>
          )}
          {q.explanation && (
            <div className="explanation-box">
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>💡 EXPLANATION</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{q.explanation}</div>
            </div>
          )}
          {idx < total - 1 && (
            <button className="btn btn-outline" onClick={onNext} style={{ alignSelf: 'flex-end' }}>
              Next Question →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ResultsScreen({ comp, userId, onBack, onLeaderboard }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    getUserCompResult(userId, comp.id).then(setResult);
  }, []);

  if (!result) return <div className="loading"><div className="loading-spinner" /></div>;

  const pct = result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0;
  const grade = pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 45 ? 'C' : 'D';
  const gradeColor = pct >= 75 ? 'var(--success)' : pct >= 45 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'radial-gradient(ellipse at center, rgba(108,99,255,0.08) 0%, transparent 60%), var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 640, width: '100%' }}>
        <div className="card" style={{ textAlign: 'center', marginBottom: 16, padding: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 16 }}>COMPETITION COMPLETE</div>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{pct >= 75 ? '🏆' : pct >= 50 ? '🎯' : '💪'}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{comp.title}</h2>
          <div style={{ fontSize: 64, fontWeight: 900, color: gradeColor, lineHeight: 1, margin: '16px 0' }}>Grade {grade}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>{result.totalScore} / {result.maxScore}</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Total Score</div>
        </div>

        <div className="grid-4" style={{ gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Attempted', value: result.attempted, total: result.totalQ, color: 'var(--accent)' },
            { label: 'Correct', value: result.correct, total: result.totalQ, color: 'var(--success)' },
            { label: 'Accuracy', value: `${result.accuracy}%`, color: result.accuracy >= 50 ? 'var(--success)' : 'var(--warning)' },
            { label: 'Tab Switches', value: result.tabSwitches || 0, color: (result.tabSwitches > 0) ? 'var(--danger)' : 'var(--success)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              {s.total !== undefined && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>of {s.total}</div>}
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onBack}>← Dashboard</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={onLeaderboard}>🏆 View Leaderboard</button>
        </div>
      </div>
    </div>
  );
}
