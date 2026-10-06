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

  // Check local users cache
  const localUsers = storage.get('local_users') || [];
  if (localUsers.some(u => u.email === email)) return { error: 'Email already registered' };

  // Check Supabase if accessible
  try {
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return { error: 'Email already registered' };
  } catch {}

  const user = { id: 'u_' + Date.now(), name, email, password, role: 'participant', joined_at: new Date().toISOString() };

  // Save to local users cache immediately
  localUsers.push(user);
  storage.set('local_users', localUsers);

  // Sync to Supabase in background
  try {
    const { error } = await supabase.from('users').insert(user);
    if (error) {
      console.warn('Supabase users insert notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase network notice:', err);
  }

  return { user: { ...user, joinedAt: user.joined_at, password: undefined } };
}

export async function loginUser(email, password) {
  if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
    return { user: { ...ADMIN_USER, password: undefined } };
  }

  // Try Supabase first
  try {
    const { data } = await supabase.from('users').select('*').eq('email', email).eq('password', password).maybeSingle();
    if (data) {
      return { user: { ...data, joinedAt: data.joined_at, password: undefined } };
    }
  } catch {}

  // Check local users cache
  const localUsers = storage.get('local_users') || [];
  const found = localUsers.find(u => u.email === email && u.password === password);
  if (found) {
    return { user: { ...found, joinedAt: found.joined_at, password: undefined } };
  }

  return { error: 'Invalid email or password' };
}

// ===== HARDCODED 10 PYTHON DEBUGGING QUESTIONS =====
export const HARDCODED_QUESTIONS = [
  {
    id: 'py_q1',
    title: 'Q1. Positive or Negative',
    difficulty: 'easy',
    marks: 10,
    category: 'Conditions',
    language: 'python',
    code: `num = 10\nif num > 0:\n    print("Negative")\nelse:\n    print("Positive")`,
    answer: 'Positive',
    explanation: 'Bug: The outputs are reversed. When num is 10 (num > 0), it printed "Negative". Fix: Swap the two printed messages. Expected output: Positive',
    enabled: true,
  },
  {
    id: 'py_q2',
    title: 'Q2. Count from 1 to 10',
    difficulty: 'easy',
    marks: 10,
    category: 'Loops',
    language: 'python',
    code: `for i in range(1, 10):\n    print(i)`,
    answer: '1 2 3 4 5 6 7 8 9 10',
    altAnswer: '1\n2\n3\n4\n5\n6\n7\n8\n9\n10',
    explanation: 'Bug: 10 is missing because range(1, 10) excludes the end value. Fix: Use range(1, 11). Expected output: 1 2 3 4 5 6 7 8 9 10',
    enabled: true,
  },
  {
    id: 'py_q3',
    title: 'Q3. Find the Smaller Number',
    difficulty: 'easy',
    marks: 10,
    category: 'Operators',
    language: 'python',
    code: `a = 15\nb = 8\n\nif a > b:\n    print(a)\nelse:\n    print(b)`,
    answer: '8',
    explanation: 'Bug: The condition (a > b) finds the larger number. Fix: Change > to < so it outputs the smaller number. Expected output: 8',
    enabled: true,
  },
  {
    id: 'py_q4',
    title: 'Q4. Calculate Total Marks',
    difficulty: 'easy',
    marks: 10,
    category: 'Arithmetic',
    language: 'python',
    code: `math = 80\nscience = 90\nenglish = 80\n\ntotal = math + science - english\nprint(total)`,
    answer: '250',
    explanation: 'Bug: English marks are subtracted (-). Fix: Use total = math + science + english. Expected output: 250',
    enabled: true,
  },
  {
    id: 'py_q5',
    title: 'Q5. Check Divisibility',
    difficulty: 'easy',
    marks: 10,
    category: 'Remainder',
    language: 'python',
    code: `num = 20\n\nif num % 5 == 1:\n    print("Divisible by 5")\nelse:\n    print("Not divisible by 5")`,
    answer: 'Divisible by 5',
    explanation: 'Bug: Remainder checked == 1 instead of == 0. Fix: Check num % 5 == 0. Expected output: Divisible by 5',
    enabled: true,
  },
  {
    id: 'py_q6',
    title: 'Q6. Sum of Even Numbers',
    difficulty: 'medium',
    marks: 10,
    category: 'Accumulation',
    language: 'python',
    code: `numbers = [2, 4, 6, 8, 10]\ntotal = 0\n\nfor n in numbers:\n    if n % 2 == 0:\n        total = n\n\nprint(total)`,
    answer: '30',
    explanation: 'Bug: total = n replaces the previous total each loop. Fix: Use total = total + n. Expected output: 30',
    enabled: true,
  },
  {
    id: 'py_q7',
    title: 'Q7. Count Numbers Greater Than 10',
    difficulty: 'medium',
    marks: 10,
    category: 'Counters',
    language: 'python',
    code: `numbers = [5, 12, 8, 20, 15]\ncount = 0\n\nfor n in numbers:\n    if n > 10:\n        count = 1\n\nprint(count)`,
    answer: '3',
    explanation: 'Bug: The counter is reset to 1 instead of accumulating. Fix: Use count = count + 1. Expected output: 3',
    enabled: true,
  },
  {
    id: 'py_q8',
    title: 'Q8. Reverse a String',
    difficulty: 'medium',
    marks: 10,
    category: 'Strings',
    language: 'python',
    code: `word = "hello"\nreverse = ""\n\nfor i in range(len(word)):\n    reverse = word[i] + reverse\n\nprint(word)`,
    answer: 'olleh',
    explanation: 'Bug: The reversed string is created in `reverse`, but `word` is printed. Fix: Change to print(reverse). Expected output: olleh',
    enabled: true,
  },
  {
    id: 'py_q9',
    title: 'Q9. Find the Largest Number',
    difficulty: 'hard',
    marks: 10,
    category: 'Algorithms',
    language: 'python',
    code: `numbers = [10, 25, 7, 18, 20]\nlargest = numbers[0]\n\nfor n in numbers:\n    if n < largest:\n        largest = n\n\nprint(largest)`,
    answer: '25',
    explanation: 'Bug: The comparison operator is reversed (< finds minimum). Fix: Change n < largest to n > largest. Expected output: 25',
    enabled: true,
  },
  {
    id: 'py_q10',
    title: 'Q10. Second Largest Number',
    difficulty: 'hard',
    marks: 10,
    category: 'Algorithms',
    language: 'python',
    code: `numbers = [10, 25, 7, 20, 15]\nlargest = 0\nsecond = 0\n\nfor n in numbers:\n    if n > largest:\n        second = largest\n        largest = n\n    elif n > second:\n        largest = n\n\nprint(second)`,
    answer: '20',
    explanation: 'Bug: The elif block updates largest instead of second. Fix: Use second = n. Expected output: 20',
    enabled: true,
  },
];

export const HARDCODED_COMPETITIONS = [
  {
    id: 'py_debug_test',
    title: 'Python Code Debugging Test',
    description: 'Beginner-Friendly • School-Level • 10 Questions (100 Marks). Anti-cheat enabled with tab switch detection & per-student shuffled questions.',
    duration: 30,
    questions: HARDCODED_QUESTIONS.map(q => q.id),
    status: 'live',
    startTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

// ===== TAB SWITCH TRACKING (Anti-cheat) =====
export function recordTabSwitch(userId, competitionId) {
  const key = `tab_switches_${competitionId}_${userId}`;
  const count = (storage.get(key) || 0) + 1;
  storage.set(key, count);
  return count;
}

export function getTabSwitches(userId, competitionId) {
  const key = `tab_switches_${competitionId}_${userId}`;
  return storage.get(key) || 0;
}

// Deterministic shuffle per student ID so each student gets questions in a different order
export function shuffleForUser(array, seedString) {
  const arr = [...array];
  let seed = 0;
  for (let i = 0; i < (seedString || '').length; i++) {
    seed = (seed * 31 + seedString.charCodeAt(i)) & 0xffffffff;
  }
  function random() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===== QUESTIONS =====
export async function getQuestions() {
  try {
    const { data } = await supabase.from('questions').select('*').order('id');
    const dbQuestions = data || [];
    const hardcodedMap = new Map(HARDCODED_QUESTIONS.map(q => [q.id, q]));
    dbQuestions.forEach(q => hardcodedMap.set(q.id, q));
    return Array.from(hardcodedMap.values());
  } catch {
    return HARDCODED_QUESTIONS;
  }
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
  const local = HARDCODED_QUESTIONS.find(q => q.id === id);
  if (local) return local;
  try {
    const { data } = await supabase.from('questions').select('*').eq('id', id).maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

// NOTE: strips answer for participants
export async function getQuestionSafe(id) {
  const q = await getQuestionById(id);
  if (!q) return null;
  const { answer, altAnswer, ...safe } = q;
  return safe;
}

// ===== COMPETITIONS =====
export async function getCompetitions() {
  try {
    const { data } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
    const dbComps = (data || []).map(c => ({
      ...c,
      questions: c.questions || [],
      startTime: c.start_time,
      createdAt: c.created_at,
    }));
    const compMap = new Map(HARDCODED_COMPETITIONS.map(c => [c.id, c]));
    dbComps.forEach(c => compMap.set(c.id, c));
    return Array.from(compMap.values());
  } catch {
    return HARDCODED_COMPETITIONS;
  }
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
  const local = HARDCODED_COMPETITIONS.find(c => c.id === id);
  if (local) return local;
  try {
    const { data } = await supabase.from('competitions').select('*').eq('id', id).maybeSingle();
    if (!data) return null;
    return { ...data, questions: data.questions || [], startTime: data.start_time, createdAt: data.created_at };
  } catch {
    return null;
  }
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

  // Check local fallback first
  const localKey = 'submissions_' + competitionId;
  const localSubs = storage.get(localKey) || [];
  const existingLocal = localSubs.find(s => s.user_id === userId && s.question_id === questionId);
  if (existingLocal) {
    return { isCorrect: existingLocal.is_correct, marks: existingLocal.marks, correctAnswer: q.answer, explanation: q.explanation };
  }

  // Check Supabase existing submission
  try {
    const { data: existing } = await supabase.from('submissions')
      .select('*').eq('user_id', userId).eq('competition_id', competitionId).eq('question_id', questionId).maybeSingle();

    if (existing) {
      return { isCorrect: existing.is_correct, marks: existing.marks, correctAnswer: q.answer, explanation: q.explanation };
    }
  } catch {}

  const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(q.answer) ||
    (q.altAnswer && normalizeAnswer(userAnswer) === normalizeAnswer(q.altAnswer));

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

  // Save to local storage cache immediately
  localSubs.push(submission);
  storage.set(localKey, localSubs);

  // Sync to Supabase in background
  try {
    await supabase.from('submissions').insert(submission);
  } catch (err) {
    console.error('Supabase submission insert error:', err);
  }

  return { isCorrect, marks: submission.marks, correctAnswer: q.answer, explanation: q.explanation };
}

export async function getUserCompResult(userId, competitionId) {
  const comp = await getCompetitionById(competitionId);
  if (!comp) return null;

  let rows = [];
  try {
    const { data: ss } = await supabase.from('submissions')
      .select('*').eq('user_id', userId).eq('competition_id', competitionId);
    rows = ss || [];
  } catch {}

  const localKey = 'submissions_' + competitionId;
  const localSubs = (storage.get(localKey) || []).filter(s => s.user_id === userId);
  localSubs.forEach(ls => {
    if (!rows.some(r => r.id === ls.id || r.question_id === ls.question_id)) {
      rows.push(ls);
    }
  });

  const totalQ = comp.questions.length;
  const attempted = rows.length;
  const correct = rows.filter(s => s.is_correct).length;
  const wrong = attempted - correct;
  const totalScore = rows.reduce((acc, s) => acc + s.marks, 0);

  // Compute max score
  let maxScore = 0;
  for (const qid of comp.questions) {
    const q = await getQuestionById(qid);
    if (q) maxScore += q.marks;
  }

  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const completionTime = rows.length > 0 ? Math.max(...rows.map(s => new Date(s.submitted_at))) : null;
  const submissions = rows.map(s => ({ ...s, isCorrect: s.is_correct, submittedAt: s.submitted_at }));
  const tabSwitches = getTabSwitches(userId, competitionId);

  return { totalQ, attempted, correct, wrong, totalScore, maxScore, accuracy, completionTime, submissions, tabSwitches };
}

export async function getLeaderboard(competitionId) {
  const comp = await getCompetitionById(competitionId);
  if (!comp) return [];

  let allSubs = [];
  try {
    const { data } = await supabase.from('submissions').select('*').eq('competition_id', competitionId);
    allSubs = data || [];
  } catch (e) {
    console.error('getLeaderboard submissions fetch error:', e);
  }

  const localSubs = storage.get('submissions_' + competitionId) || [];
  const combinedSubs = [...allSubs];
  localSubs.forEach(ls => {
    if (!combinedSubs.some(s => s.id === ls.id || (s.user_id === ls.user_id && s.question_id === ls.question_id))) {
      combinedSubs.push(ls);
    }
  });

  let users = [];
  try {
    const { data } = await supabase.from('users').select('id,name,email');
    users = data || [];
  } catch {}

  const localUsers = storage.get('local_users') || [];
  const combinedUsers = [...users, ...localUsers];

  const userMap = {};
  combinedSubs.forEach(s => {
    if (!userMap[s.user_id]) userMap[s.user_id] = { userId: s.user_id, score: 0, correct: 0, lastTime: 0 };
    if (s.is_correct) { userMap[s.user_id].score += s.marks; userMap[s.user_id].correct += 1; }
    const t = new Date(s.submitted_at).getTime();
    if (t > userMap[s.user_id].lastTime) userMap[s.user_id].lastTime = t;
  });

  return Object.values(userMap)
    .map(u => {
      const user = combinedUsers.find(x => x.id === u.userId) || { name: 'Student ' + String(u.userId).slice(-4), email: '' };
      const tabSwitches = getTabSwitches(u.userId, competitionId);
      return { ...u, name: user.name, email: user.email, tabSwitches };
    })
    // Sort: highest score first -> fewest tab switches first -> fastest time first
    .sort((a, b) => b.score - a.score || a.tabSwitches - b.tabSwitches || a.lastTime - b.lastTime)
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
