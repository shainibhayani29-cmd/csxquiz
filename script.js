// ── CONFIG ──
const TOTAL_Q   = 10;
const TIMER_SEC = 15;

// ── STATE ──
let currentDiff = 'all';
let quiz = [], idx = 0, score = 0, correct = 0, wrong = 0, skipped = 0;
let timerInterval, timeLeft;
let answered = false;

// ── SCREEN MANAGEMENT ──
const screens = {
  start:  document.getElementById('screen-start'),
  quiz:   document.getElementById('screen-quiz'),
  result: document.getElementById('screen-result')
};

function showScreen(id) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[id].classList.add('active');
}

// ── DIFFICULTY SELECTOR ──
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentDiff = btn.dataset.diff;
  });
});

// ── BUTTON EVENTS ──
document.getElementById('btn-start').addEventListener('click', startQuiz);
document.getElementById('btn-next').addEventListener('click', nextQuestion);
document.getElementById('btn-retry').addEventListener('click', () => showScreen('start'));
document.getElementById('btn-home').addEventListener('click',  () => showScreen('start'));

// ── SHUFFLE HELPER ──
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── START QUIZ ──
function startQuiz() {
  let pool = currentDiff === 'all'
    ? questions
    : questions.filter(q => q.difficulty === currentDiff);

  // Fallback to all questions if filtered pool is too small
  if (pool.length < TOTAL_Q) pool = questions;

  quiz    = shuffle(pool).slice(0, TOTAL_Q);
  idx     = 0;
  score   = 0;
  correct = 0;
  wrong   = 0;
  skipped = 0;

  document.getElementById('q-total').textContent = TOTAL_Q;
  showScreen('quiz');
  renderQuestion();
}

// ── RENDER QUESTION ──
function renderQuestion() {
  answered = false;
  const q = quiz[idx];

  document.getElementById('q-num').textContent      = idx + 1;
  document.getElementById('q-category').textContent = '// ' + q.category;
  document.getElementById('q-text').textContent     = q.question;
  document.getElementById('progress-fill').style.width = ((idx / TOTAL_Q) * 100) + '%';

  // Reset feedback
  const feedbackBox = document.getElementById('feedback-box');
  feedbackBox.classList.remove('show', 'correct-fb', 'wrong-fb');

  // Reset Next button
  const btnNext = document.getElementById('btn-next');
  btnNext.classList.remove('show');
  btnNext.textContent = idx < TOTAL_Q - 1 ? 'Next Question →' : 'See Results →';

  // Shuffle options and remember correct answer text
  const correctText = q.options[q.answer];
  const shuffled    = shuffle([...q.options]);
  const labels      = ['A', 'B', 'C', 'D'];

  const list = document.getElementById('options-list');
  list.innerHTML = '';

  shuffled.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="opt-label">${labels[i]}</span>${opt}`;
    btn.addEventListener('click', () => selectAnswer(btn, opt, correctText));
    list.appendChild(btn);
  });

  startTimer();
}

// ── SELECT ANSWER ──
function selectAnswer(btn, chosen, correctText) {
  if (answered) return;
  answered = true;
  clearInterval(timerInterval);

  const allBtns    = document.querySelectorAll('.option-btn');
  const feedbackBox = document.getElementById('feedback-box');

  allBtns.forEach(b => (b.disabled = true));

  if (chosen === correctText) {
    btn.classList.add('correct');
    score++;
    correct++;
    feedbackBox.textContent = '✓ Correct! Well done.';
    feedbackBox.className   = 'feedback-box show correct-fb';
  } else {
    btn.classList.add('wrong');
    wrong++;
    // Highlight the correct answer
    allBtns.forEach(b => {
      if (b.innerText.includes(correctText)) b.classList.add('correct');
    });
    feedbackBox.textContent = `✗ Incorrect. The correct answer is: "${correctText}"`;
    feedbackBox.className   = 'feedback-box show wrong-fb';
  }

  document.getElementById('btn-next').classList.add('show');
}

// ── TIMER ──
function startTimer() {
  timeLeft = TIMER_SEC;
  const timerEl = document.getElementById('timer');
  timerEl.textContent = timeLeft;
  timerEl.classList.remove('urgent');

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 5) timerEl.classList.add('urgent');
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timeUp();
    }
  }, 1000);
}

function timeUp() {
  if (answered) return;
  answered = true;
  skipped++;

  const q           = quiz[idx];
  const correctText = q.options[q.answer];
  const allBtns     = document.querySelectorAll('.option-btn');

  allBtns.forEach(b => {
    b.disabled = true;
    if (b.innerText.includes(correctText)) b.classList.add('correct');
  });

  const feedbackBox = document.getElementById('feedback-box');
  feedbackBox.textContent = `⏱ Time's up! The correct answer was: "${correctText}"`;
  feedbackBox.className   = 'feedback-box show wrong-fb';
  document.getElementById('btn-next').classList.add('show');
}

// ── NEXT QUESTION ──
function nextQuestion() {
  idx++;
  if (idx < TOTAL_Q) {
    renderQuestion();
  } else {
    showResults();
  }
}

// ── SHOW RESULTS ──
function showResults() {
  document.getElementById('r-grade').textContent   = `${score}/${TOTAL_Q}`;
  document.getElementById('r-correct').textContent = correct;
  document.getElementById('r-wrong').textContent   = wrong;
  document.getElementById('r-skipped').textContent = skipped;

  const pct = (score / TOTAL_Q) * 100;
  let icon, verdict, msg;

  if (pct === 100) {
    icon = '🏆'; verdict = 'Perfect Score!';       msg = 'Outstanding! You are a cybersecurity expert.';
  } else if (pct >= 80) {
    icon = '🛡️'; verdict = 'Security Pro';          msg = 'Excellent work! Your knowledge is strong.';
  } else if (pct >= 60) {
    icon = '🔒'; verdict = 'Good Job!';             msg = 'Solid performance. Keep learning!';
  } else if (pct >= 40) {
    icon = '⚠️'; verdict = 'Keep Practicing';       msg = 'You have the basics. Study more to improve!';
  } else {
    icon = '🔓'; verdict = 'Needs Improvement';     msg = "Don't give up — review the fundamentals!";
  }

  document.getElementById('r-icon').textContent    = icon;
  document.getElementById('r-verdict').textContent = verdict;
  document.getElementById('r-msg').textContent     = msg;
  document.getElementById('progress-fill').style.width = '100%';

  showScreen('result');
}
