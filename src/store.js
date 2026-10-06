// ===== INITIAL SEED DATA =====
const ADMIN_USER = { id: 'admin', email: 'admin@codepredict.com', password: 'admin123', role: 'admin', name: 'Admin' };

const SAMPLE_QUESTIONS = [
  {
    id: 'q1', title: 'Loop Sum', language: 'python',
    code: `x = 2\ny = 3\n\nfor i in range(y):\n    x += i\n\nprint(x)`,
    answer: '5', explanation: 'range(3) gives 0,1,2. x starts at 2. x+=0=2, x+=1=3, x+=2=5. Output: 5',
    difficulty: 'easy', marks: 5, category: 'Loops', enabled: true,
  },
  {
    id: 'q2', title: 'String Multiply', language: 'python',
    code: `s = "ab"\nprint(s * 3)`,
    answer: 'ababab', explanation: 'In Python, multiplying a string by n repeats it n times.',
    difficulty: 'easy', marks: 5, category: 'Strings', enabled: true,
  },
  {
    id: 'q3', title: 'List Comprehension', language: 'python',
    code: `nums = [1, 2, 3, 4, 5]\nresult = [x**2 for x in nums if x % 2 == 0]\nprint(result)`,
    answer: '[4, 16]', explanation: 'Only even numbers (2 and 4) are squared. 2²=4, 4²=16.',
    difficulty: 'medium', marks: 10, category: 'Lists', enabled: true,
  },
  {
    id: 'q4', title: 'JavaScript Hoisting', language: 'javascript',
    code: `console.log(typeof x);\nvar x = 5;\nconsole.log(x);`,
    answer: 'undefined\n5', explanation: 'var declarations are hoisted but not initialized. typeof hoisted var returns "undefined", then x is assigned 5.',
    difficulty: 'medium', marks: 10, category: 'Hoisting', enabled: true,
  },
  {
    id: 'q5', title: 'Closure Counter', language: 'javascript',
    code: `function counter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\nconst c = counter();\nconsole.log(c());\nconsole.log(c());\nconsole.log(c());`,
    answer: '1\n2\n3', explanation: 'Each call to c() increments the closure variable count by 1.',
    difficulty: 'hard', marks: 15, category: 'Closures', enabled: true,
  },
  {
    id: 'q6', title: 'Java Output', language: 'java',
    code: `int a = 10, b = 3;\nSystem.out.println(a / b);\nSystem.out.println(a % b);`,
    answer: '3\n1', explanation: 'Integer division 10/3 = 3. Modulo 10%3 = 1.',
    difficulty: 'easy', marks: 5, category: 'Operators', enabled: true,
  },
  {
    id: 'q7', title: 'Python Default Arg', language: 'python',
    code: `def greet(name, msg="Hello"):\n    print(msg, name)\n\ngreet("Alice")\ngreet("Bob", "Hi")`,
    answer: 'Hello Alice\nHi Bob', explanation: 'Default argument msg="Hello" is used when not provided. When "Hi" is passed, it overrides the default.',
    difficulty: 'easy', marks: 5, category: 'Functions', enabled: true,
  },
  {
    id: 'q8', title: 'Recursive Factorial', language: 'python',
    code: `def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n-1)\n\nprint(fact(5))`,
    answer: '120', explanation: '5! = 5×4×3×2×1 = 120',
    difficulty: 'medium', marks: 10, category: 'Recursion', enabled: true,
  },
];

const SAMPLE_COMPETITIONS = [
  {
    id: 'comp1',
    title: 'Python Fundamentals Sprint',
    description: 'Test your Python knowledge by predicting outputs of various Python snippets.',
    duration: 30,
    questions: ['q1', 'q2', 'q3', 'q7', 'q8'],
    status: 'live',
    startTime: new Date(Date.now() - 5 * 60000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comp2',
    title: 'JavaScript Deep Dive',
    description: 'Challenge your JS understanding — closures, hoisting, and more!',
    duration: 45,
    questions: ['q4', 'q5'],
    status: 'upcoming',
    startTime: new Date(Date.now() + 2 * 3600000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comp3',
    title: 'Multi-Language Output Challenge',
    description: 'Mix of Python, JavaScript and Java questions.',
    duration: 60,
    questions: ['q1', 'q4', 'q6', 'q3', 'q5'],
    status: 'ended',
    startTime: new Date(Date.now() - 24 * 3600000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

// ===== STORAGE HELPERS =====
export const storage = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => { localStorage.setItem(key, JSON.stringify(val)); },
  remove: (key) => { localStorage.removeItem(key); },
};

export function initStore() {
  if (!storage.get('cp_initialized')) {
    storage.set('cp_users', []);
    storage.set('cp_questions', SAMPLE_QUESTIONS);
    storage.set('cp_competitions', SAMPLE_COMPETITIONS);
    storage.set('cp_submissions', []);
    storage.set('cp_initialized', true);
  }
}

// ===== USERS =====
export function getUsers() { return storage.get('cp_users') || []; }
export function saveUsers(users) { storage.set('cp_users', users); }

export function registerUser(name, email, password) {
  const users = getUsers();
  if (email === ADMIN_USER.email) return { error: 'Email already taken' };
  if (users.find(u => u.email === email)) return { error: 'Email already registered' };
  const user = { id: 'u_' + Date.now(), name, email, password, role: 'participant', joinedAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  return { user };
}

export function loginUser(email, password) {
  if (email === ADMIN_USER.email && password === ADMIN_USER.password) return { user: { ...ADMIN_USER, password: undefined } };
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return { error: 'Invalid email or password' };
  return { user: { ...user, password: undefined } };
}

// ===== QUESTIONS =====
export function getQuestions() { return storage.get('cp_questions') || []; }
export function saveQuestions(qs) { storage.set('cp_questions', qs); }

export function addQuestion(q) {
  const qs = getQuestions();
  const newQ = { ...q, id: 'q_' + Date.now(), enabled: true };
  qs.push(newQ);
  saveQuestions(qs);
  return newQ;
}

export function updateQuestion(id, data) {
  const qs = getQuestions().map(q => q.id === id ? { ...q, ...data } : q);
  saveQuestions(qs);
}

export function deleteQuestion(id) {
  saveQuestions(getQuestions().filter(q => q.id !== id));
}

export function getQuestionById(id) {
  return getQuestions().find(q => q.id === id);
}

// NOTE: This strips answers for participant view
export function getQuestionSafe(id) {
  const q = getQuestionById(id);
  if (!q) return null;
  const { answer, ...safe } = q;
  return safe;
}

// ===== COMPETITIONS =====
export function getCompetitions() { return storage.get('cp_competitions') || []; }
export function saveCompetitions(cs) { storage.set('cp_competitions', cs); }

export function addCompetition(c) {
  const cs = getCompetitions();
  const newC = { ...c, id: 'comp_' + Date.now(), createdAt: new Date().toISOString() };
  cs.push(newC);
  saveCompetitions(cs);
  return newC;
}

export function updateCompetition(id, data) {
  const cs = getCompetitions().map(c => c.id === id ? { ...c, ...data } : c);
  saveCompetitions(cs);
}

export function deleteCompetition(id) {
  saveCompetitions(getCompetitions().filter(c => c.id !== id));
}

export function getCompetitionById(id) {
  return getCompetitions().find(c => c.id === id);
}

// ===== SUBMISSIONS =====
export function getSubmissions() { return storage.get('cp_submissions') || []; }
export function saveSubmissions(ss) { storage.set('cp_submissions', ss); }

export function submitAnswer(userId, competitionId, questionId, userAnswer) {
  const q = getQuestionById(questionId);
  if (!q) return null;
  const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(q.answer);
  const ss = getSubmissions();
  const existing = ss.find(s => s.userId === userId && s.competitionId === competitionId && s.questionId === questionId);
  const submission = {
    id: 's_' + Date.now(),
    userId, competitionId, questionId,
    userAnswer, isCorrect,
    marks: isCorrect ? q.marks : 0,
    submittedAt: new Date().toISOString(),
  };
  if (existing) {
    const updated = ss.map(s => (s.userId === userId && s.competitionId === competitionId && s.questionId === questionId) ? submission : s);
    saveSubmissions(updated);
  } else {
    ss.push(submission);
    saveSubmissions(ss);
  }
  return { isCorrect, marks: submission.marks, correctAnswer: q.answer, explanation: q.explanation };
}

export function getUserCompResult(userId, competitionId) {
  const ss = getSubmissions().filter(s => s.userId === userId && s.competitionId === competitionId);
  const comp = getCompetitionById(competitionId);
  if (!comp) return null;
  const totalQ = comp.questions.length;
  const attempted = ss.length;
  const correct = ss.filter(s => s.isCorrect).length;
  const wrong = attempted - correct;
  const totalScore = ss.reduce((acc, s) => acc + s.marks, 0);
  const maxScore = comp.questions.reduce((acc, qid) => { const q = getQuestionById(qid); return acc + (q ? q.marks : 0); }, 0);
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const completionTime = ss.length > 0 ? Math.max(...ss.map(s => new Date(s.submittedAt))) : null;
  return { totalQ, attempted, correct, wrong, totalScore, maxScore, accuracy, completionTime, submissions: ss };
}

export function getLeaderboard(competitionId) {
  const comp = getCompetitionById(competitionId);
  if (!comp) return [];
  const users = getUsers();
  const allSubs = getSubmissions().filter(s => s.competitionId === competitionId);
  const userMap = {};
  allSubs.forEach(s => {
    if (!userMap[s.userId]) userMap[s.userId] = { userId: s.userId, score: 0, correct: 0, lastTime: 0 };
    if (s.isCorrect) { userMap[s.userId].score += s.marks; userMap[s.userId].correct += 1; }
    const t = new Date(s.submittedAt).getTime();
    if (t > userMap[s.userId].lastTime) userMap[s.userId].lastTime = t;
  });
  return Object.values(userMap)
    .map(u => {
      const user = users.find(x => x.id === u.userId) || { name: 'Unknown' };
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
