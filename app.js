// ── STORAGE KEYS ──
const KEYS = {
  studyLog: 'cfa_study_log',       // [{date:'YYYY-MM-DD', hours:2.5}]
  dailyGoal: 'cfa_daily_goal',     // number
  completed: 'cfa_completed',      // {`s${id}_t${id}`: true}
};

// ── HELPERS ──
function today() {
  return new Date().toISOString().split('T')[0];
}

function getStudyLog() {
  return JSON.parse(localStorage.getItem(KEYS.studyLog) || '[]');
}

function saveStudyLog(log) {
  localStorage.setItem(KEYS.studyLog, JSON.stringify(log));
}

function getDailyGoal() {
  return parseFloat(localStorage.getItem(KEYS.dailyGoal) || '4');
}

function saveDailyGoal(g) {
  localStorage.setItem(KEYS.dailyGoal, g.toString());
}

function getCompleted() {
  return JSON.parse(localStorage.getItem(KEYS.completed) || '{}');
}

function saveCompleted(c) {
  localStorage.setItem(KEYS.completed, JSON.stringify(c));
}

function toggleCompleted(subjectId, topicId) {
  const c = getCompleted();
  const key = `s${subjectId}_t${topicId}`;
  c[key] = !c[key];
  saveCompleted(c);
  return c[key];
}

function isCompleted(subjectId, topicId) {
  return !!getCompleted()[`s${subjectId}_t${topicId}`];
}

// ── STUDY HOURS ──
function logHoursForDate(date, hours) {
  const log = getStudyLog();
  const existing = log.find(l => l.date === date);
  if (existing) {
    existing.hours = hours;
  } else {
    log.push({ date, hours });
  }
  log.sort((a, b) => a.date.localeCompare(b.date));
  saveStudyLog(log);
}

function getHoursForDate(date) {
  const log = getStudyLog();
  const entry = log.find(l => l.date === date);
  return entry ? entry.hours : 0;
}

// ── ROLLOVER CALCULATION ──
// Returns the effective target for today including accumulated deficit/surplus
function getTodayTarget() {
  const goal = getDailyGoal();
  const log = getStudyLog();
  const todayStr = today();
  let deficit = 0;
  // sum up all past days' deficit/surplus (not including today)
  log.filter(l => l.date < todayStr).forEach(l => {
    deficit += (goal - l.hours);
  });
  // effective target = goal + deficit (deficit can be negative = surplus)
  return Math.max(0, goal + deficit);
}

// ── PROGRESS RING SVG ──
function progressRing(pct, color, size = 80, stroke = 7) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return `<svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--surface2)" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
      style="transition:stroke-dashoffset 0.6s ease"/>
  </svg>`;
}

// ── LOAD DATA.JSON ──
async function loadData() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Failed to load data.json');
    return await res.json();
  } catch (e) {
    console.error('Could not load data.json:', e);
    return { subjects: [] };
  }
}

// ── ACTIVE NAV ──
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ── QA ACCORDIONS ──
function initQA() {
  document.querySelectorAll('.qa-question').forEach(q => {
    q.addEventListener('click', () => {
      const ans = q.nextElementSibling;
      const chev = q.querySelector('.qa-chevron');
      ans.classList.toggle('open');
      if (chev) chev.classList.toggle('open');
    });
  });
}

// ── HEATMAP ──
function buildHeatmap(containerId, log, goal) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const today = new Date();
  const cells = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = log.find(l => l.date === dateStr);
    const hours = entry ? entry.hours : 0;
    let level = 0;
    if (hours > 0) {
      const ratio = hours / goal;
      if (ratio >= 1) level = 4;
      else if (ratio >= 0.75) level = 3;
      else if (ratio >= 0.5) level = 2;
      else level = 1;
    }
    cells.push(`<div class="heat-cell heat-${level}" data-tip="${dateStr}: ${hours}h"></div>`);
  }
  el.innerHTML = cells.join('');
}
