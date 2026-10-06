import { supabase } from './supabase';

// ===== ADMIN USER (hardcoded, no DB needed) =====
const ADMIN_USER = { id: 'admin', email: 'admin@codepredict.com', password: 'admin123', role: 'admin', name: 'Admin' };

// ===== SESSION (localStorage for session only) =====
export const storage = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => { localStorage.setItem(key, JSON.stringify(val)); },
  remove: (key) => { localStorage.removeItem(key); },
};

// ===== USERS =====
export async function getUsers() {
  const { data } = await supabase.from('users').select('*').order('joined_at', { ascending: false });
  return (data || []).map(u => ({ ...u, joinedAt: u.joined_at }));
}

export async function registerUser(name, email, password) {
  if (email === ADMIN_USER.email) return { error: 'Email already taken' };
  const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) return { error: 'Email already registered' };
  const user = { id: 'u_' + Date.now(), name, email, password, role: 'participant', joined_at: new Date().toISOString() };
  const { error } = await supabase.from('users').insert(user);
  if (error) {
    console.error('registerUser error:', error);
    return { error: error.message };
  }
  return { user: { ...user, joinedAt: user.joined_at, password: undefined } };
}

export async function loginUser(email, password) {
  if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
    return { user: { ...ADMIN_USER, password: undefined } };
  }
  const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).maybeSingle();
  if (error || !data) return { error: error ? error.message : 'Invalid email or password' };
  return { user: { ...data, joinedAt: data.joined_at, password: undefined } };
}

// ===== QUESTIONS =====
export async function getQuestions() {
  const { data } = await supabase.from('questions').select('*').order('id');
  return data || [];
}

export async function addQuestion(q) {
  const newQ = { ...q, id: 'q_' + Date.now(), enabled: true };
  await supabase.from('questions').insert(newQ);
  return newQ;
}

export async function updateQuestion(id, data) {
  await supabase.from('questions').update(data).eq('id', id);
}

export async function deleteQuestion(id) {
  await supabase.from('questions').delete().eq('id', id);
}

export async function getQuestionById(id) {
  const { data } = await supabase.from('questions').select('*').eq('id', id).maybeSingle();
  return data || null;
}

// NOTE: strips answer for participants
export async function getQuestionSafe(id) {
  const q = await getQuestionById(id);
  if (!q) return null;
  const { answer, ...safe } = q;
  return safe;
}

// ===== COMPETITIONS =====
export async function getCompetitions() {
  const { data } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
  return (data || []).map(c => ({
    ...c,
    questions: c.questions || [],
    startTime: c.start_time,
    createdAt: c.created_at,
  }));
}

export async function addCompetition(c) {
  const newC = {
    ...c,
    id: 'comp_' + Date.now(),
    questions: c.questions || [],
    start_time: c.startTime || new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  await supabase.from('competitions').insert(newC);
  return { ...newC, startTime: newC.start_time, createdAt: newC.created_at };
}

export async function updateCompetition(id, data) {
  const payload = { ...data };
  if (payload.startTime) { payload.start_time = payload.startTime; delete payload.startTime; }
  if (payload.createdAt) { payload.created_at = payload.createdAt; delete payload.createdAt; }
  await supabase.from('competitions').update(payload).eq('id', id);
}

export async function deleteCompetition(id) {
  await supabase.from('competitions').delete().eq('id', id);
}

export async function getCompetitionById(id) {
  const { data } = await supabase.from('competitions').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  return { ...data, questions: data.questions || [], startTime: data.start_time, createdAt: data.created_at };
}

// ===== SUBMISSIONS =====
export async function getSubmissions() {
  const { data } = await supabase.from('submissions').select('*').order('submitted_at', { ascending: false });
  return (data || []).map(s => ({
    ...s,
    userId: s.user_id,
    competitionId: s.competition_id,
    questionId: s.question_id,
    userAnswer: s.user_answer,
    isCorrect: s.is_correct,
    submittedAt: s.submitted_at,
  }));
}

export async function submitAnswer(userId, competitionId, questionId, userAnswer) {
  const q = await getQuestionById(questionId);
  if (!q) return null;

  // Check for existing submission first (lock answer after submit)
  const { data: existing } = await supabase.from('submissions')
    .select('*').eq('user_id', userId).eq('competition_id', competitionId).eq('question_id', questionId).maybeSingle();

  if (existing) {
    return { isCorrect: existing.is_correct, marks: existing.marks, correctAnswer: q.answer, explanation: q.explanation };
  }

  const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(q.answer);
  const submission = {
    id: 's_' + Date.now(),
    user_id: userId,
    competition_id: competitionId,
    question_id: questionId,
    user_answer: userAnswer,
    is_correct: isCorrect,
    marks: isCorrect ? q.marks : 0,
    submitted_at: new Date().toISOString(),
  };
  await supabase.from('submissions').insert(submission);
  return { isCorrect, marks: submission.marks, correctAnswer: q.answer, explanation: q.explanation };
}

export async function getUserCompResult(userId, competitionId) {
  const comp = await getCompetitionById(competitionId);
  if (!comp) return null;
  const { data: ss } = await supabase.from('submissions')
    .select('*').eq('user_id', userId).eq('competition_id', competitionId);
  const rows = ss || [];
  const totalQ = comp.questions.length;
  const attempted = rows.length;
  const correct = rows.filter(s => s.is_correct).length;
  const wrong = attempted - correct;
  const totalScore = rows.reduce((acc, s) => acc + s.marks, 0);
  // Compute max score from questions
  const qIds = comp.questions;
  const { data: qData } = await supabase.from('questions').select('id,marks').in('id', qIds);
  const maxScore = (qData || []).reduce((acc, q) => acc + q.marks, 0);
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const completionTime = rows.length > 0 ? Math.max(...rows.map(s => new Date(s.submitted_at))) : null;
  const submissions = rows.map(s => ({ ...s, isCorrect: s.is_correct, submittedAt: s.submitted_at }));
  return { totalQ, attempted, correct, wrong, totalScore, maxScore, accuracy, completionTime, submissions };
}

export async function getLeaderboard(competitionId) {
  const comp = await getCompetitionById(competitionId);
  if (!comp) return [];
  const { data: allSubs } = await supabase.from('submissions').select('*').eq('competition_id', competitionId);
  const { data: users } = await supabase.from('users').select('id,name,email');
  const userMap = {};
  (allSubs || []).forEach(s => {
    if (!userMap[s.user_id]) userMap[s.user_id] = { userId: s.user_id, score: 0, correct: 0, lastTime: 0 };
    if (s.is_correct) { userMap[s.user_id].score += s.marks; userMap[s.user_id].correct += 1; }
    const t = new Date(s.submitted_at).getTime();
    if (t > userMap[s.user_id].lastTime) userMap[s.user_id].lastTime = t;
  });
  return Object.values(userMap)
    .map(u => {
      const user = (users || []).find(x => x.id === u.userId) || { name: 'Unknown' };
      return { ...u, name: user.name, email: user.email };
    })
    .sort((a, b) => b.score - a.score || a.lastTime - b.lastTime)
    .map((u, i) => ({ ...u, rank: i + 1 }));
}

// ===== UTILS =====
function normalizeAnswer(ans) {
  return String(ans).toLowerCase().replace(/\s+/g, '');
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function difficultyColor(d) {
  if (d === 'easy') return 'badge-easy';
  if (d === 'medium') return 'badge-medium';
  return 'badge-hard';
}

export const LANG_COLORS = { python: '#3776ab', javascript: '#f7df1e', java: '#ed8b00', c: '#a8b9cc', cpp: '#00599c', typescript: '#3178c6' };
export const LANGUAGES = ['python', 'javascript', 'java', 'c', 'cpp', 'typescript'];
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const CATEGORIES = ['Loops', 'Strings', 'Lists', 'Functions', 'Recursion', 'Closures', 'Hoisting', 'Operators', 'Classes', 'OOP', 'Async', 'Other'];
