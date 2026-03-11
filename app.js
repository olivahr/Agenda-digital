// ── STATE ──────────────────────────────────────────────────────────
const STATE_KEY = 'myday_v2';

const QUOTES = [
  { text: "Hoy es un buen día para tener un buen día 🌸", icon: "🌸" },
  { text: "Eres capaz de cosas increíbles, paso a paso.", icon: "✨" },
  { text: "Un pequeño progreso cada día suma grandes resultados.", icon: "🌿" },
  { text: "Tu esfuerzo de hoy es el orgullo de mañana.", icon: "💛" },
  { text: "Respira. Tú lo tienes todo bajo control.", icon: "🦋" },
  { text: "Cada tarea completada es una victoria que celebrar.", icon: "🎀" },
  { text: "Cuídate tanto como cuidas a los demás.", icon: "🌺" },
  { text: "No tienes que ser perfecta, solo tienes que ser tú.", icon: "💫" },
  { text: "El desorden de hoy es el orden de mañana.", icon: "🍵" },
  { text: "Eres más fuerte de lo que crees, siempre.", icon: "🌙" },
  { text: "Pequeños pasos siguen siendo pasos hacia adelante.", icon: "🦢" },
  { text: "Mereces darte el crédito por todo lo que haces.", icon: "🌷" },
];

const CATEGORIES = [
  { id: 'all',      label: 'Todas',      emoji: '🌸', color: '#F4A5B0' },
  { id: 'personal', label: 'Personal',   emoji: '💆', color: '#C4B7DC' },
  { id: 'trabajo',  label: 'Trabajo',    emoji: '💼', color: '#F9C7AA' },
  { id: 'salud',    label: 'Salud',      emoji: '🌿', color: '#B5CDB8' },
  { id: 'hogar',    label: 'Hogar',      emoji: '🏡', color: '#FAE3A0' },
  { id: 'social',   label: 'Social',     emoji: '🤍', color: '#F4A5B0' },
];

const HABITS = [
  { id: 'agua',     name: 'Tomar agua',    icon: '💧' },
  { id: 'ejercicio',name: 'Moverme',       icon: '🏃‍♀️' },
  { id: 'leer',     name: 'Leer algo',     icon: '📖' },
  { id: 'gratitud', name: 'Agradecer',     icon: '🙏' },
  { id: 'descanso', name: 'Dormir bien',   icon: '🌙' },
];

const DAYS_SHORT = ['D','L','M','X','J','V','S'];

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return {
    tasks:  [],
    habits: {},
    quoteIdx: Math.floor(Math.random() * QUOTES.length),
  };
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

// ── HELPERS ───────────────────────────────────────────────────────
function todayKey()  { return new Date().toISOString().slice(0,10); }
function weekKeys()  {
  const today = new Date(); const keys = [];
  const dow = today.getDay(); // 0=Sun
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    keys.push(d.toISOString().slice(0,10));
  }
  return keys;
}
function catColor(catId) {
  return CATEGORIES.find(c=>c.id===catId)?.color || '#F4A5B0';
}
function uid() { return Math.random().toString(36).slice(2,10); }

// ── CURRENT VIEW STATE ────────────────────────────────────────────
let currentTab    = 'hoy';
let currentFilter = 'all';

// ── RENDER ────────────────────────────────────────────────────────
function render() {
  renderHeader();
  renderQuote();
  renderProgress();
  renderTabContent();
  saveState();
}

function renderHeader() {
  const now = new Date();
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  document.getElementById('date-label').textContent =
    now.toLocaleDateString('es-ES', opts);
}

function renderQuote() {
  const q = QUOTES[state.quoteIdx];
  document.getElementById('quote-icon').textContent = q.icon;
  document.getElementById('quote-text').textContent = q.text;
}

function renderProgress() {
  const today = todayKey();
  const todayTasks = state.tasks.filter(t => t.date === today);
  const done  = todayTasks.filter(t => t.done).length;
  const total = todayTasks.length;
  const pct   = total === 0 ? 0 : Math.round((done/total)*100);

  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent  = pct + '%';
  document.getElementById('stat-done').textContent     = done;
  document.getElementById('stat-total').textContent    = total;
  document.getElementById('stat-pending').textContent  = total - done;
}

function renderTabContent() {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === currentTab);
  });

  const panels = { hoy: false, semana: false, habitos: false };
  panels[currentTab] = true;
  document.getElementById('panel-hoy').style.display     = panels.hoy     ? '' : 'none';
  document.getElementById('panel-semana').style.display  = panels.semana  ? '' : 'none';
  document.getElementById('panel-habitos').style.display = panels.habitos ? '' : 'none';

  if (currentTab === 'hoy')     renderTodayPanel();
  if (currentTab === 'semana')  renderWeekPanel();
  if (currentTab === 'habitos') renderHabitsPanel();
}

// ── TODAY PANEL ───────────────────────────────────────────────────
function renderTodayPanel() {
  renderCategoryFilters();
  renderTaskList();
}

function renderCategoryFilters() {
  const wrap = document.getElementById('cat-filters');
  wrap.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-chip' + (currentFilter === cat.id ? ' active' : '');
    btn.textContent = cat.emoji + ' ' + cat.label;
    btn.onclick = () => { currentFilter = cat.id; renderTodayPanel(); };
    wrap.appendChild(btn);
  });
}

function renderTaskList() {
  const list  = document.getElementById('task-list');
  const today = todayKey();
  let tasks = state.tasks.filter(t => t.date === today);
  if (currentFilter !== 'all') tasks = tasks.filter(t => t.cat === currentFilter);

  list.innerHTML = '';

  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🌸</span>
        <p>¡Todo tranquilo! Agrega algo para organizar tu día.</p>
      </div>`;
    return;
  }

  tasks.sort((a,b) => a.done - b.done);

  tasks.forEach(task => {
    const cat = CATEGORIES.find(c=>c.id===task.cat) || CATEGORIES[1];
    const li  = document.createElement('div');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.style.setProperty('--cat-color', cat.color);
    li.dataset.id = task.id;

    li.innerHTML = `
      <button class="task-check" onclick="toggleTask('${task.id}')">${task.done ? '✓' : ''}</button>
      <div class="task-body">
        <div class="task-text">${escHtml(task.text)}</div>
        <div class="task-meta">${formatTime(task.createdAt)}</div>
      </div>
      <span class="task-cat-badge">${cat.emoji} ${cat.label}</span>
      <button class="task-delete" onclick="deleteTask('${task.id}')" title="Eliminar">×</button>
    `;

    list.appendChild(li);

    // entrance animation
    requestAnimationFrame(() => li.classList.add('entering'));
  });
}

// ── WEEK PANEL ────────────────────────────────────────────────────
function renderWeekPanel() {
  const grid  = document.getElementById('week-grid');
  const today = todayKey();
  const keys  = weekKeys();
  const now   = new Date();
  const dow   = now.getDay();

  grid.innerHTML = '';

  keys.forEach((key, i) => {
    const dayDate  = new Date(key + 'T12:00:00');
    const dayTasks = state.tasks.filter(t => t.date === key);
    const done     = dayTasks.filter(t=>t.done);
    const isToday  = key === today;

    const card = document.createElement('div');
    card.className = 'day-card' + (isToday ? ' today' : '');
    card.title = `Ver ${key}`;

    const dotHtml = dayTasks.slice(0,6).map(t =>
      `<span class="dot${t.done?' done':''}"></span>`
    ).join('');

    card.innerHTML = `
      <div class="day-name">${DAYS_SHORT[dayDate.getDay()]}</div>
      <div class="day-num">${dayDate.getDate()}</div>
      <div class="day-dot-row">${dotHtml}</div>
      <div class="week-task-count">${done.length}/${dayTasks.length}</div>
    `;

    card.onclick = () => {
      // Jump to that day's tasks in a mini view
      showDayDetail(key, dayDate);
    };

    grid.appendChild(card);
  });
}

function showDayDetail(dateKey, dateObj) {
  const tasks = state.tasks.filter(t=>t.date===dateKey);
  const opts  = { weekday:'long', day:'numeric', month:'long' };
  const label = dateObj.toLocaleDateString('es-ES', opts);

  let html = `<strong style="font-family:'Playfair Display',serif;font-size:1.05rem;">${label}</strong><br><br>`;
  if (tasks.length === 0) {
    html += '<span style="color:var(--muted);font-style:italic">Sin tareas registradas</span>';
  } else {
    tasks.forEach(t => {
      const cat = CATEGORIES.find(c=>c.id===t.cat)||CATEGORIES[1];
      html += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <span>${t.done?'✅':'⬜'}</span>
        <span style="${t.done?'text-decoration:line-through;color:var(--muted)':''}">${escHtml(t.text)}</span>
        <span style="font-size:0.75rem;color:var(--muted)">${cat.emoji}</span>
      </div>`;
    });
  }

  showToast(label + ': ' + tasks.filter(t=>t.done).length + '/' + tasks.length + ' completadas');
}

// ── HABITS PANEL ──────────────────────────────────────────────────
function renderHabitsPanel() {
  const wrap   = document.getElementById('habits-wrap');
  const keys   = weekKeys();
  const today  = todayKey();
  wrap.innerHTML = '';

  HABITS.forEach(habit => {
    const row = document.createElement('div');
    row.className = 'habit-row';

    // count current streak
    const streak = calcStreak(habit.id);

    const dayBtns = keys.map((key, i) => {
      const dayDate = new Date(key + 'T12:00:00');
      const checked = (state.habits[key] || {})[habit.id];
      return `<button class="habit-day-btn${checked?' checked':''}"
        onclick="toggleHabit('${habit.id}','${key}')"
        title="${dayDate.toLocaleDateString('es-ES',{weekday:'short'})}"
        >${DAYS_SHORT[dayDate.getDay()]}</button>`;
    }).join('');

    row.innerHTML = `
      <div class="habit-icon">${habit.icon}</div>
      <div class="habit-body">
        <div class="habit-name">${habit.name}</div>
        <div class="habit-days">${dayBtns}</div>
      </div>
      <div class="habit-streak">
        <span class="streak-num">${streak}</span>
        <span class="streak-label">racha</span>
      </div>
    `;

    wrap.appendChild(row);
  });
}

function calcStreak(habitId) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0,10);
    if ((state.habits[key] || {})[habitId]) streak++;
    else if (i > 0) break;
  }
  return streak;
}

// ── ACTIONS ───────────────────────────────────────────────────────
function addTask() {
  const input = document.getElementById('task-input');
  const select= document.getElementById('cat-select');
  const text  = input.value.trim();
  if (!text) { input.focus(); shakeEl(input); return; }

  const task = {
    id:        uid(),
    text,
    cat:       select.value,
    done:      false,
    date:      todayKey(),
    createdAt: new Date().toISOString(),
  };
  state.tasks.push(task);
  input.value = '';
  input.focus();
  render();
  showToast('Tarea agregada 🌸');
}

function toggleTask(id) {
  const task = state.tasks.find(t=>t.id===id);
  if (!task) return;
  task.done = !task.done;
  render();
  if (task.done) {
    showToast('¡Completada! 🎉');
    const allToday = state.tasks.filter(t=>t.date===todayKey());
    if (allToday.length > 0 && allToday.every(t=>t.done)) {
      setTimeout(fireConfetti, 300);
      showToast('¡Terminaste todo! Eres increíble ✨');
    }
  }
}

function deleteTask(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) {
    el.classList.add('leaving');
    setTimeout(() => {
      state.tasks = state.tasks.filter(t=>t.id!==id);
      render();
    }, 350);
  }
}

function toggleHabit(habitId, dateKey) {
  if (!state.habits[dateKey]) state.habits[dateKey] = {};
  state.habits[dateKey][habitId] = !state.habits[dateKey][habitId];
  renderHabitsPanel();
  saveState();
}

function nextQuote() {
  state.quoteIdx = (state.quoteIdx + 1) % QUOTES.length;
  const icon = document.getElementById('quote-icon');
  const text = document.getElementById('quote-text');
  icon.style.transform = 'scale(0) rotate(-20deg)';
  text.style.opacity = '0';
  setTimeout(() => {
    renderQuote();
    icon.style.transition = 'transform 0.4s cubic-bezier(.34,1.56,.64,1)';
    icon.style.transform = '';
    text.style.transition = 'opacity 0.3s';
    text.style.opacity = '';
    saveState();
  }, 200);
}

// ── TOAST ─────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── CONFETTI ─────────────────────────────────────────────────────
function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#F4A5B0','#F9C7AA','#FAE3A0','#B5CDB8','#C4B7DC'];
  const pieces = Array.from({length: 90}, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    r: Math.random() * 7 + 3,
    c: colors[Math.floor(Math.random()*colors.length)],
    sp: Math.random() * 3 + 2,
    sw: Math.random() * 3 - 1.5,
    rot: Math.random() * 360,
    rv: Math.random() * 6 - 3,
  }));

  let frame;
  let start = null;
  function draw(ts) {
    if (!start) start = ts;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    let alive = false;
    pieces.forEach(p => {
      p.y  += p.sp;
      p.x  += p.sw;
      p.rot+= p.rv;
      if (p.y < canvas.height + 20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r);
      ctx.restore();
    });
    if (alive && ts - start < 3000) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  cancelAnimationFrame(frame);
  requestAnimationFrame(draw);
}

// ── UTILS ─────────────────────────────────────────────────────────
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});
}
function shakeEl(el) {
  el.style.animation = 'none';
  el.style.borderColor = '#d95f6e';
  setTimeout(() => {
    el.style.borderColor = '';
  }, 800);
}

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  render();

  // Tab clicks
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      renderTabContent();
    });
  });

  // Quote click
  document.getElementById('quote-card').addEventListener('click', nextQuote);

  // Add task on Enter
  document.getElementById('task-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });

  // Add button
  document.getElementById('add-btn').addEventListener('click', addTask);

  // Keyboard shortcut: N = new task focus
  document.addEventListener('keydown', e => {
    if (e.key === 'n' && document.activeElement.tagName !== 'INPUT') {
      document.getElementById('task-input').focus();
      e.preventDefault();
    }
  });
});
