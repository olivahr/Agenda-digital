/* ═══════════════════════════════════════════════════════════════
   BLOOM — app.js
   Toda la lógica de la aplicación
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── CONSTANTES ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'bloom_v1';

const QUOTES = [
  'Pequeños pasos, grandes sueños. ✦',
  'Hoy es exactamente el día perfecto. ✿',
  'Tu esfuerzo tiene nombre y se llama progreso.',
  'Cuídate como cuidas a quien más quieres. 🌸',
  'No tienes que ser perfecta, solo tienes que ser tú. ❋',
  'Cada tarea completada es una victoria que celebrar.',
  'Mereces todo lo bueno que viene. ✿',
  'Un día a la vez, un paso a la vez.',
  'Tu energía es sagrada, úsala bien. ◈',
  'Hoy hiciste lo mejor que pudiste. Eso es suficiente.',
  'Eres más fuerte de lo que crees, siempre. 🌸',
  'El progreso, no la perfección. ✦',
];

const MOODS = [
  { id: 'amazing',   emoji: '🥰', label: 'Increíble', color: '#E8A4A8' },
  { id: 'good',      emoji: '😊', label: 'Bien',      color: '#D4A96A' },
  { id: 'okay',      emoji: '😌', label: 'Normal',    color: '#8AB8D4' },
  { id: 'tired',     emoji: '😴', label: 'Cansada',   color: '#B4A8D0' },
  { id: 'sad',       emoji: '😔', label: 'Triste',    color: '#8FA890' },
  { id: 'stressed',  emoji: '😤', label: 'Estresada', color: '#D4906A' },
  { id: 'anxious',   emoji: '😰', label: 'Ansiosa',   color: '#A898D0' },
  { id: 'grateful',  emoji: '🙏', label: 'Agradecida',color: '#B5CDB8' },
];

const CATS = {
  personal: { label: 'Personal', emoji: '💆', color: '#B4A8D0' },
  trabajo:  { label: 'Trabajo',  emoji: '💼', color: '#D4A96A' },
  salud:    { label: 'Salud',    emoji: '🌿', color: '#8FAF8A' },
  hogar:    { label: 'Hogar',    emoji: '🏡', color: '#E8C4A0' },
  social:   { label: 'Social',   emoji: '🤍', color: '#E8A4A8' },
  estudios: { label: 'Estudios', emoji: '📚', color: '#8AB8D4' },
};

const POMO_MODES = {
  work:  { label: 'FOCO',            mins: 25 },
  short: { label: 'DESCANSO CORTO',  mins: 5  },
  long:  { label: 'DESCANSO LARGO',  mins: 15 },
};

const MONEY_ICONS = {
  comida: '🍕', ropa: '👗', transporte: '🚌',
  salud: '💊', ocio: '🎬', hogar: '🏠',
  ahorro: '🏦', otro: '📦',
};

const DEFAULT_HABITS = [
  { id: 'agua',      name: 'Tomar agua',      icon: '💧', desc: '8 vasos al día',     color: 'rgba(138,184,212,0.15)' },
  { id: 'ejercicio', name: 'Moverme',          icon: '🏃‍♀️', desc: '30 min de actividad', color: 'rgba(143,175,138,0.15)' },
  { id: 'leer',      name: 'Leer',             icon: '📖', desc: 'Al menos 10 páginas', color: 'rgba(212,169,106,0.15)' },
  { id: 'meditar',   name: 'Momento de calma', icon: '🧘‍♀️', desc: '5 min de silencio',  color: 'rgba(180,168,208,0.15)' },
  { id: 'diario',    name: 'Escribir',         icon: '✍️', desc: 'Diario personal',    color: 'rgba(232,164,168,0.15)' },
];

const DEFAULT_LISTS = [
  { id: 'compras', title: 'Lista de compras',  emoji: '🛒', items: [] },
  { id: 'pelis',   title: 'Películas / Series', emoji: '🎬', items: [] },
  { id: 'deseos',  title: 'Lista de deseos',   emoji: '✨', items: [] },
  { id: 'libros',  title: 'Libros para leer',  emoji: '📚', items: [] },
];

// ── ESTADO GLOBAL ─────────────────────────────────────────────────────────────

function defaultState() {
  return {
    tasks:       [],
    notes:       [],
    habits:      {},     // { 'YYYY-MM-DD': { habitId: true/false } }
    habitDefs:   DEFAULT_HABITS.map(h => ({ ...h })),
    mood:        {},     // { 'YYYY-MM-DD': moodId }
    moodNotes:   {},     // { 'YYYY-MM-DD': 'texto' }
    transactions: [],
    lists:       DEFAULT_LISTS.map(l => ({ ...l, items: [] })),
    pomo: {
      sessionsTotal: 0,
      today: { date: '', sessions: 0, minutes: 0 },
      log:   [],
    },
    quoteIdx:    0,
    userName:    'amor',
  };
}

let S = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // merge con defaults para no perder campos nuevos
      return Object.assign(defaultState(), parsed);
    }
  } catch (e) {
    console.warn('Error al cargar estado:', e);
  }
  return defaultState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  } catch (e) {
    console.warn('Error al guardar:', e);
  }
}

// ── UTILIDADES ────────────────────────────────────────────────────────────────

const uid       = () => Math.random().toString(36).slice(2, 9);
const todayKey  = () => new Date().toISOString().slice(0, 10);
const esc       = s  => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
function fmtDateLong(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function weekKeys() {
  const keys = [], today = new Date(), dow = today.getDay();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function monthInfo() {
  const now = new Date();
  return {
    year:  now.getFullYear(),
    month: now.getMonth(),
    days:  new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    first: new Date(now.getFullYear(), now.getMonth(), 1).getDay(),
  };
}

// ── TOAST ─────────────────────────────────────────────────────────────────────

let _toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── CONFETTI ──────────────────────────────────────────────────────────────────

function fireConfetti() {
  const cv  = document.getElementById('confetti-canvas');
  const ctx = cv.getContext('2d');
  cv.width  = window.innerWidth;
  cv.height = window.innerHeight;
  const colors = ['#E8A4A8', '#D4A96A', '#B5CDB8', '#B4A8D0', '#8AB8D4', '#E8C4A0'];
  const pieces = Array.from({ length: 110 }, () => ({
    x:   Math.random() * cv.width,
    y:   -10,
    r:   Math.random() * 6 + 3,
    c:   colors[Math.floor(Math.random() * colors.length)],
    sp:  Math.random() * 3 + 2,
    sw:  Math.random() * 3 - 1.5,
    rot: Math.random() * 360,
    rv:  Math.random() * 5 - 2.5,
  }));
  let frame, start = null;
  function draw(ts) {
    if (!start) start = ts;
    ctx.clearRect(0, 0, cv.width, cv.height);
    let alive = false;
    pieces.forEach(p => {
      p.y += p.sp; p.x += p.sw; p.rot += p.rv;
      if (p.y < cv.height + 20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
      ctx.restore();
    });
    if (alive && ts - start < 3500) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, cv.width, cv.height);
  }
  cancelAnimationFrame(frame);
  requestAnimationFrame(draw);
}

// ══════════════════════════════════════════════════════════════════════════════
// NAVEGACIÓN
// ══════════════════════════════════════════════════════════════════════════════

let currentPanel = 'dashboard';

function openPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('panel-' + id);
  const btn   = document.querySelector(`[data-panel="${id}"]`);
  if (panel) panel.classList.add('active');
  if (btn)   btn.classList.add('active');
  currentPanel = id;
  renderPanel(id);
}

function renderPanel(id) {
  const fns = {
    dashboard: renderDashboard,
    tasks:     renderTasks,
    habits:    renderHabits,
    pomodoro:  renderPomoSide,
    notes:     renderNotes,
    mood:      renderMood,
    money:     renderMoney,
    lists:     renderLists,
  };
  if (fns[id]) fns[id]();
}

// bind nav buttons
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => openPanel(btn.dataset.panel));
});

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

function renderDashboard() {
  const today = todayKey();
  const now   = new Date();
  const h     = now.getHours();

  // saludo dinámico
  const greetWord = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
  const titleEl   = document.querySelector('#panel-dashboard h1.page-title');
  if (titleEl) titleEl.innerHTML = `${greetWord}, <em id="dash-name">${esc(S.userName)}</em> ✿`;

  // día y fecha
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const eyebrow = document.getElementById('dash-eyebrow');
  if (eyebrow) eyebrow.textContent = fmtDate(now.toISOString());

  const welcomeDay = document.getElementById('welcome-day');
  if (welcomeDay) welcomeDay.textContent = '✦ ' + days[now.getDay()];

  const welcomeDate = document.getElementById('welcome-date');
  if (welcomeDate) welcomeDate.textContent = fmtDateLong(now.toISOString());

  // cita motivacional
  const quoteEl = document.getElementById('welcome-quote');
  if (quoteEl) {
    quoteEl.textContent = QUOTES[S.quoteIdx];
    quoteEl.onclick = () => {
      S.quoteIdx = (S.quoteIdx + 1) % QUOTES.length;
      quoteEl.textContent = QUOTES[S.quoteIdx];
      saveState();
    };
  }

  // tareas de hoy
  const todayTasks = S.tasks.filter(t => t.date === today);
  const doneTasks  = todayTasks.filter(t => t.done);
  const total      = todayTasks.length;
  const done       = doneTasks.length;

  setEl('sc-done',    done);
  setEl('sc-streak',  calcGlobalStreak());
  setEl('sc-pomos',   S.pomo.today.date === today ? S.pomo.today.sessions : 0);

  // badge de tareas pendientes
  const badge = document.getElementById('tasks-badge');
  if (badge) badge.textContent = total - done;

  // anillo de progreso
  const pct    = total === 0 ? 0 : Math.round((done / total) * 100);
  const circ   = 232;
  const offset = circ - (pct / 100 * circ);
  setEl('ring-pct',     pct + '%');
  setEl('ring-done',    done);
  setEl('ring-pending', total - done);
  setEl('ring-total',   total);
  const ringFill = document.getElementById('ring-fill');
  if (ringFill) ringFill.style.strokeDashoffset = offset;

  // mini lista de tareas
  const dashTasks = document.getElementById('dash-tasks');
  if (dashTasks) {
    if (todayTasks.length === 0) {
      dashTasks.innerHTML = '<div style="color:var(--text3);font-size:0.82rem;padding:12px 0;text-align:center;font-style:italic">Sin tareas hoy — ¡agrega algo! ✦</div>';
    } else {
      dashTasks.innerHTML = todayTasks.slice(0, 6).map(t => {
        const cat = CATS[t.cat] || CATS.personal;
        return `<div class="mini-task${t.done ? ' done' : ''}">
          <button class="mini-check" onclick="quickToggleTask('${t.id}')">${t.done ? '✓' : ''}</button>
          <span class="mini-task-text">${esc(t.text)}</span>
          <span class="mini-task-cat">${cat.emoji}</span>
        </div>`;
      }).join('');
    }
  }

  // estado de ánimo rápido
  const dashMood   = document.getElementById('dash-mood');
  const todayMood  = S.mood[today];
  if (dashMood) {
    dashMood.innerHTML = MOODS.slice(0, 5).map(m => `
      <button class="quick-mood-btn${todayMood === m.id ? ' selected' : ''}"
        onclick="quickSaveMood('${m.id}')">
        <span class="quick-mood-emoji">${m.emoji}</span>
        <span class="quick-mood-label">${m.label}</span>
      </button>`).join('');
  }
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function quickToggleTask(id) {
  const t = S.tasks.find(x => x.id === id);
  if (t) { t.done = !t.done; saveState(); renderDashboard(); }
}

function quickSaveMood(id) {
  S.mood[todayKey()] = id;
  saveState();
  renderDashboard();
  const m = MOODS.find(x => x.id === id);
  toast('Ánimo guardado ' + (m ? m.emoji : ''));
}

function calcGlobalStreak() {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayHabits = S.habits[key] || {};
    if (Object.values(dayHabits).some(v => v)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

// ══════════════════════════════════════════════════════════════════════════════
// TAREAS
// ══════════════════════════════════════════════════════════════════════════════

let taskFilter = 'all';

function renderTasks() {
  // barra de filtros
  const fb = document.getElementById('task-filter-bar');
  if (fb) {
    const filters = [
      { id: 'all', label: 'Todas' },
      ...Object.entries(CATS).map(([id, c]) => ({ id, label: c.emoji + ' ' + c.label })),
      { id: 'pending', label: '⧖ Pendientes' },
      { id: 'done',    label: '✓ Completadas' },
    ];
    fb.innerHTML = filters.map(f =>
      `<button class="filter-chip${taskFilter === f.id ? ' active' : ''}"
        onclick="setTaskFilter('${f.id}')">${f.label}</button>`
    ).join('');
  }

  // filtrar tareas
  let tasks = [...S.tasks];
  if (taskFilter === 'done')    tasks = tasks.filter(t => t.done);
  else if (taskFilter === 'pending') tasks = tasks.filter(t => !t.done);
  else if (taskFilter !== 'all')    tasks = tasks.filter(t => t.cat === taskFilter);

  // badge
  const today = todayKey();
  const badge = document.getElementById('tasks-badge');
  if (badge) badge.textContent = S.tasks.filter(t => t.date === today && !t.done).length;

  const container = document.getElementById('tasks-list');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <span class="empty-state-icon">◎</span>
      <div class="empty-state-title">Todo despejado por aquí</div>
      <div class="empty-state-sub">Agrega algo para comenzar ✦</div>
    </div>`;
    return;
  }

  // agrupar por fecha
  const groups = {};
  tasks.forEach(t => {
    const label = t.date === today ? 'Hoy' : t.date < today ? 'Antes' : 'Próximamente';
    if (!groups[label]) groups[label] = [];
    groups[label].push(t);
  });

  container.innerHTML = Object.entries(groups).map(([grp, ts]) => {
    const sorted = ts.slice().sort((a, b) => a.done - b.done);
    return `<div class="task-group">
      <div class="task-group-label">${grp} <span style="color:var(--text3)">(${ts.length})</span></div>
      ${sorted.map(t => renderTaskItem(t)).join('')}
    </div>`;
  }).join('');
}

function renderTaskItem(t) {
  const cat    = CATS[t.cat] || CATS.personal;
  const priMap = { high: ['pri-high', 'Alta'], med: ['pri-med', 'Media'], low: ['pri-low', 'Baja'] };
  const [priClass, priLabel] = priMap[t.priority] || priMap.med;
  return `<div class="task-item${t.done ? ' done' : ''}" style="--c:${cat.color}" data-id="${t.id}">
    <button class="t-check" onclick="toggleTask('${t.id}')">${t.done ? '✓' : ''}</button>
    <div class="t-body">
      <div class="t-text">${esc(t.text)}</div>
      <div class="t-meta">
        <span class="t-cat">${cat.emoji} ${cat.label}</span>
        <span class="t-date">${fmtDate(t.date)} ${fmtTime(t.createdAt)}</span>
        <span class="t-pri ${priClass}">${priLabel}</span>
      </div>
    </div>
    <div class="t-actions">
      <button class="t-act" onclick="editTask('${t.id}')" title="Editar">✎</button>
      <button class="t-act del" onclick="deleteTask('${t.id}')" title="Eliminar">✕</button>
    </div>
  </div>`;
}

function setTaskFilter(f) {
  taskFilter = f;
  renderTasks();
}

function addTask() {
  const inp  = document.getElementById('task-input');
  const text = inp ? inp.value.trim() : '';
  if (!text) {
    if (inp) { inp.style.boxShadow = '0 0 0 3px rgba(232,100,110,0.25)'; setTimeout(() => inp.style.boxShadow = '', 800); }
    return;
  }
  const catEl = document.getElementById('task-cat');
  const priEl = document.getElementById('task-priority');
  S.tasks.push({
    id:        uid(),
    text,
    cat:       catEl ? catEl.value : 'personal',
    priority:  priEl ? priEl.value : 'med',
    done:      false,
    date:      todayKey(),
    createdAt: new Date().toISOString(),
  });
  if (inp) inp.value = '';
  saveState();
  renderTasks();
  renderDashboard();
  toast('Tarea agregada ✦');
}

function toggleTask(id) {
  const t = S.tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  saveState();
  renderTasks();
  renderDashboard();
  if (t.done) {
    const today = S.tasks.filter(x => x.date === todayKey());
    if (today.length > 0 && today.every(x => x.done)) {
      fireConfetti();
      toast('¡Terminaste todo hoy! Eres increíble ✦');
    } else {
      toast('¡Tarea completada! 🌸');
    }
  }
}

function deleteTask(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) {
    el.style.transition = 'all 0.28s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateX(30px)';
    setTimeout(() => {
      S.tasks = S.tasks.filter(x => x.id !== id);
      saveState();
      renderTasks();
      renderDashboard();
    }, 280);
  }
}

function editTask(id) {
  const t = S.tasks.find(x => x.id === id);
  if (!t) return;
  const newText = prompt('Editar tarea:', t.text);
  if (newText && newText.trim()) {
    t.text = newText.trim();
    saveState();
    renderTasks();
  }
}

// Enter para agregar tarea
document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

// ══════════════════════════════════════════════════════════════════════════════
// HÁBITOS
// ══════════════════════════════════════════════════════════════════════════════

function renderHabits() {
  const keys  = weekKeys();
  const today = todayKey();
  const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const table = document.getElementById('habits-table');
  if (!table) return;

  const thead = `<thead><tr>
    <th>Hábito</th>
    ${keys.map(k => {
      const d       = new Date(k + 'T12:00:00');
      const isToday = k === today;
      return `<th class="day-col" style="${isToday ? 'color:var(--rose)' : ''}">
        <div>${DAY_LABELS[d.getDay()]}</div>
        <div style="font-size:0.68rem;color:var(--text3)">${d.getDate()}</div>
      </th>`;
    }).join('')}
    <th style="text-align:center">Racha</th>
  </tr></thead>`;

  const tbody = '<tbody>' + S.habitDefs.map(habit => {
    const streak = calcHabitStreak(habit.id);
    const cells  = keys.map(k => {
      const checked = (S.habits[k] || {})[habit.id];
      const isToday = k === today;
      return `<td class="habit-day-cell">
        <button class="hday-btn${checked ? ' done' : ''}${isToday && !checked ? ' is-today' : ''}"
          onclick="toggleHabit('${habit.id}','${k}')">
          ${checked ? '✓' : new Date(k + 'T12:00:00').getDate()}
        </button>
      </td>`;
    }).join('');
    return `<tr>
      <td>
        <div class="habit-name-cell">
          <div class="habit-icon-cell" style="background:${habit.color}">${habit.icon}</div>
          <div>
            <div class="habit-name-text">${esc(habit.name)}</div>
            <div class="habit-desc-text">${esc(habit.desc || '')}</div>
          </div>
        </div>
      </td>
      ${cells}
      <td class="streak-cell">
        <span class="streak-num">${streak}</span>
        <span class="streak-icon">${streak >= 3 ? '🔥' : streak >= 1 ? '✦' : ''}</span>
      </td>
    </tr>`;
  }).join('') + '</tbody>';

  table.innerHTML = thead + tbody;

  // estadísticas
  const statsEl = document.getElementById('habit-stats');
  if (statsEl) {
    const totalChecks = Object.values(S.habits).reduce((acc, day) =>
      acc + Object.values(day).filter(Boolean).length, 0);
    const bestStreak  = Math.max(...S.habitDefs.map(h => calcHabitStreak(h.id)), 0);
    const todayChecks = Object.values(S.habits[today] || {}).filter(Boolean).length;
    const totalDays   = Object.keys(S.habits).length;

    statsEl.innerHTML = [
      { n: totalChecks,                              l: 'Total completados'  },
      { n: bestStreak + (bestStreak >= 3 ? ' 🔥' : ''), l: 'Mejor racha actual' },
      { n: `${todayChecks}/${S.habitDefs.length}`,   l: 'Hoy'               },
      { n: totalDays,                                l: 'Días registrados'   },
    ].map(s => `<div class="hstat">
      <span class="hstat-num">${s.n}</span>
      <span class="hstat-lbl">${s.l}</span>
    </div>`).join('');
  }
}

function toggleHabit(habitId, dateKey) {
  if (!S.habits[dateKey]) S.habits[dateKey] = {};
  S.habits[dateKey][habitId] = !S.habits[dateKey][habitId];
  saveState();
  renderHabits();
  renderDashboard();
  if (S.habits[dateKey][habitId]) {
    const h = S.habitDefs.find(x => x.id === habitId);
    toast('¡Hábito completado! ' + (h ? h.icon : ''));
  }
}

function calcHabitStreak(habitId) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((S.habits[key] || {})[habitId]) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

function addHabitDialog() {
  const name = prompt('Nombre del hábito:');
  if (!name || !name.trim()) return;
  const icon = prompt('Emoji o ícono:', '⭐') || '⭐';
  const desc = prompt('Descripción breve (opcional):') || '';
  S.habitDefs.push({
    id:    uid(),
    name:  name.trim(),
    icon,
    desc,
    color: 'rgba(232,164,168,0.12)',
  });
  saveState();
  renderHabits();
  toast('Hábito agregado ' + icon);
}

// ══════════════════════════════════════════════════════════════════════════════
// POMODORO
// ══════════════════════════════════════════════════════════════════════════════

let pomoMode    = 'work';
let pomoSecs    = 25 * 60;
let pomoTotal   = 25 * 60;
let pomoRunning = false;
let pomoTimer   = null;

function setPomoMode(mode, el) {
  if (pomoRunning) return;
  document.querySelectorAll('.pomo-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  pomoMode  = mode;
  pomoSecs  = POMO_MODES[mode].mins * 60;
  pomoTotal = pomoSecs;
  updatePomoUI();
}

function togglePomo() {
  if (pomoRunning) {
    clearInterval(pomoTimer);
    pomoRunning = false;
    setEl('pomo-play-btn', '▶');
  } else {
    pomoRunning = true;
    setEl('pomo-play-btn', '⏸');
    pomoTimer = setInterval(() => {
      pomoSecs--;
      if (pomoSecs <= 0) {
        clearInterval(pomoTimer);
        pomoRunning = false;
        setEl('pomo-play-btn', '▶');
        onPomoComplete();
      }
      updatePomoUI();
    }, 1000);
  }
}

function resetPomo() {
  clearInterval(pomoTimer);
  pomoRunning = false;
  pomoSecs    = POMO_MODES[pomoMode].mins * 60;
  pomoTotal   = pomoSecs;
  setEl('pomo-play-btn', '▶');
  updatePomoUI();
}

function skipPomo() { resetPomo(); }

function onPomoComplete() {
  if (pomoMode !== 'work') return;
  const today = todayKey();
  if (S.pomo.today.date !== today) {
    S.pomo.today = { date: today, sessions: 0, minutes: 0 };
  }
  S.pomo.today.sessions++;
  S.pomo.today.minutes += POMO_MODES.work.mins;
  S.pomo.sessionsTotal++;
  S.pomo.log.unshift({ time: new Date().toISOString(), mins: POMO_MODES.work.mins });
  if (S.pomo.log.length > 20) S.pomo.log.pop();
  saveState();
  renderPomoSide();
  renderDashboard();
  fireConfetti();
  toast('¡Sesión de foco completada! 🌸 Tómate un descanso');
}

function updatePomoUI() {
  const m = String(Math.floor(pomoSecs / 60)).padStart(2, '0');
  const s = String(pomoSecs % 60).padStart(2, '0');
  setEl('pomo-time',  `${m}:${s}`);
  setEl('pomo-phase', POMO_MODES[pomoMode].label);

  const circ   = 628;
  const pct    = (pomoTotal - pomoSecs) / pomoTotal;
  const offset = circ - pct * circ;
  const fill   = document.getElementById('pomo-fill');
  if (fill) fill.style.strokeDashoffset = offset;

  document.title = pomoRunning ? `${m}:${s} — Bloom` : 'Bloom ✿';
}

function renderPomoSide() {
  const today = todayKey();
  const pd    = S.pomo.today.date === today ? S.pomo.today : { sessions: 0, minutes: 0 };
  setEl('p-sess-today',  pd.sessions);
  setEl('p-min-today',   pd.minutes);
  setEl('p-sess-total',  S.pomo.sessionsTotal);
  setEl('p-streak',      calcGlobalStreak());
  updatePomoUI();

  // log
  const logEl     = document.getElementById('pomo-log');
  const todayLog  = S.pomo.log.filter(l => l.time.slice(0, 10) === today);
  if (!logEl) return;
  if (todayLog.length === 0) {
    logEl.innerHTML = '<div class="pomo-empty">Aún no hay sesiones hoy</div>';
  } else {
    logEl.innerHTML = todayLog.map((l, i) => `
      <div class="pomo-log-item">
        <span class="pomo-log-dot" style="background:var(--rose)"></span>
        <span class="pomo-log-txt">Sesión ${todayLog.length - i}</span>
        <span class="pomo-log-dur">${l.mins} min · ${fmtTime(l.time)}</span>
      </div>`).join('');
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// NOTAS
// ══════════════════════════════════════════════════════════════════════════════

let currentNoteId = null;
let noteSaveDelay = null;

function renderNotes() {
  const listEl  = document.getElementById('notes-list');
  const countEl = document.getElementById('notes-count');
  if (countEl) countEl.textContent = S.notes.length;
  if (!listEl) return;

  if (S.notes.length === 0) {
    listEl.innerHTML = '<div class="notes-empty">Aún no tienes notas.<br>¡Crea la primera! ✦</div>';
    return;
  }
  listEl.innerHTML = S.notes.map(n => `
    <div class="note-list-item${n.id === currentNoteId ? ' active' : ''}" onclick="openNote('${n.id}')">
      <div class="note-list-title">${esc(n.title) || 'Sin título'}</div>
      <div class="note-list-preview">${esc(n.preview) || '...'}</div>
      <div class="note-list-date">${fmtDate(n.updatedAt)}</div>
    </div>`).join('');
}

function newNote() {
  const note = {
    id:        uid(),
    title:     '',
    content:   '',
    preview:   '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  S.notes.unshift(note);
  saveState();
  openNote(note.id);
  renderNotes();
  toast('Nueva nota creada ✦');
}

function openNote(id) {
  currentNoteId = id;
  const note = S.notes.find(n => n.id === id);
  if (!note) return;
  const titleEl = document.getElementById('note-title');
  const bodyEl  = document.getElementById('note-body');
  const savedEl = document.getElementById('note-saved');
  if (titleEl) titleEl.value = note.title;
  if (bodyEl)  bodyEl.innerHTML = note.content || '';
  if (savedEl) savedEl.textContent = note.updatedAt ? 'Guardado ' + fmtDate(note.updatedAt) : '—';
  renderNotes();
  updateWordCount();
}

function saveNote() {
  if (!currentNoteId) return;
  const note = S.notes.find(n => n.id === currentNoteId);
  if (!note) return;
  const titleEl = document.getElementById('note-title');
  const bodyEl  = document.getElementById('note-body');
  note.title     = (titleEl ? titleEl.value.trim() : '') || 'Sin título';
  note.content   = bodyEl ? bodyEl.innerHTML : '';
  note.preview   = bodyEl ? bodyEl.innerText.slice(0, 70) : '';
  note.updatedAt = new Date().toISOString();
  // subir al top si no está
  const idx = S.notes.findIndex(n => n.id === currentNoteId);
  if (idx > 0) {
    const [n] = S.notes.splice(idx, 1);
    S.notes.unshift(n);
  }
  saveState();
  renderNotes();
  const savedEl = document.getElementById('note-saved');
  if (savedEl) savedEl.textContent = 'Guardado ahora';
}

function deleteCurrentNote() {
  if (!currentNoteId) return;
  if (!confirm('¿Eliminar esta nota?')) return;
  S.notes = S.notes.filter(n => n.id !== currentNoteId);
  currentNoteId = null;
  const bodyEl  = document.getElementById('note-body');
  const titleEl = document.getElementById('note-title');
  if (bodyEl)  bodyEl.innerHTML = '<p style="color:var(--text3);font-style:italic">Selecciona una nota...</p>';
  if (titleEl) titleEl.value = '';
  saveState();
  renderNotes();
  toast('Nota eliminada');
}

function execFmt(cmd) { document.execCommand(cmd, false, null); }

function insertSym(sym) {
  const body = document.getElementById('note-body');
  if (body) { body.focus(); document.execCommand('insertText', false, sym); }
}

function updateWordCount() {
  const body    = document.getElementById('note-body');
  const wordsEl = document.getElementById('note-words');
  if (!body || !wordsEl) return;
  const text  = body.innerText || '';
  const count = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  wordsEl.textContent = count + ' palabras';
}

// autoguardado
const noteBody = document.getElementById('note-body');
if (noteBody) {
  noteBody.addEventListener('input', () => {
    updateWordCount();
    clearTimeout(noteSaveDelay);
    noteSaveDelay = setTimeout(saveNote, 1500);
  });
}
const noteTitleInput = document.getElementById('note-title');
if (noteTitleInput) {
  noteTitleInput.addEventListener('input', () => {
    clearTimeout(noteSaveDelay);
    noteSaveDelay = setTimeout(saveNote, 1500);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// ESTADO DE ÁNIMO
// ══════════════════════════════════════════════════════════════════════════════

let selectedMood = null;

function renderMood() {
  const today    = todayKey();
  selectedMood   = S.mood[today] || null;

  // picker
  const pickerEl = document.getElementById('mood-picker');
  if (pickerEl) {
    pickerEl.innerHTML = MOODS.map(m => `
      <button class="mood-pick-btn${selectedMood === m.id ? ' selected' : ''}"
        onclick="selectMoodBtn('${m.id}')">
        <span class="mood-pick-emoji">${m.emoji}</span>
        <span class="mood-pick-label">${m.label}</span>
      </button>`).join('');
  }

  // nota del día
  const noteEl = document.getElementById('mood-note');
  if (noteEl) noteEl.value = S.moodNotes[today] || '';

  renderMoodCalendar();
  renderMoodStats();
}

function selectMoodBtn(id) {
  selectedMood = id;
  document.querySelectorAll('.mood-pick-btn').forEach((btn, i) => {
    btn.classList.toggle('selected', MOODS[i].id === id);
    const lbl = btn.querySelector('.mood-pick-label');
    if (lbl) lbl.style.color = MOODS[i].id === id ? 'var(--rose)' : '';
  });
}

function saveMood() {
  if (!selectedMood) { toast('Selecciona cómo te sientes primero'); return; }
  const today   = todayKey();
  const noteEl  = document.getElementById('mood-note');
  S.mood[today]      = selectedMood;
  S.moodNotes[today] = noteEl ? noteEl.value : '';
  saveState();
  renderMood();
  renderDashboard();
  const m = MOODS.find(x => x.id === selectedMood);
  toast('Ánimo guardado ' + (m ? m.emoji : ''));
}

function renderMoodCalendar() {
  const { year, month, days, first } = monthInfo();
  const today    = todayKey();
  const calEl    = document.getElementById('mood-cal');
  const titleEl  = document.getElementById('mood-cal-title');
  const DAY_LBLS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (titleEl) {
    const raw = new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    titleEl.textContent = raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  if (!calEl) return;

  let html = DAY_LBLS.map(d => `<div class="mood-cal-day-lbl">${d}</div>`).join('');
  for (let i = 0; i < first; i++) html += '<div></div>';

  for (let d = 1; d <= days; d++) {
    const key    = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const moodId = S.mood[key];
    const mood   = MOODS.find(m => m.id === moodId);
    const isToday = key === today;
    html += `<div class="mood-day-cell${isToday ? ' today' : ''}"
      style="${mood ? `background:${mood.color}22;border-color:${mood.color}66` : ''}"
      title="${mood ? mood.label : ''}">
      ${mood ? `<span>${mood.emoji}</span>` : ''}
      <span class="mood-day-num">${d}</span>
    </div>`;
  }
  calEl.innerHTML = html;
}

function renderMoodStats() {
  const statsEl = document.getElementById('mood-stats');
  if (!statsEl) return;
  const counts = {};
  MOODS.forEach(m => { counts[m.id] = 0; });
  Object.values(S.mood).forEach(id => { if (counts[id] !== undefined) counts[id]++; });
  statsEl.innerHTML = MOODS.slice(0, 4).map(m => `
    <div class="mood-stat-card">
      <span class="mood-stat-emoji">${m.emoji}</span>
      <span class="mood-stat-count">${counts[m.id] || 0}</span>
      <span class="mood-stat-name">${m.label}</span>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════════════════════════════
// FINANZAS
// ══════════════════════════════════════════════════════════════════════════════

function renderMoney() {
  const txs     = S.transactions;
  const income  = txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const balance = income - expense;

  const summaryEl = document.getElementById('money-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="money-card">
        <div class="money-card-lbl">Balance total</div>
        <div class="money-card-num ${balance >= 0 ? 'income' : 'expense'}">
          ${balance >= 0 ? '+' : '-'}$${Math.abs(balance).toLocaleString('es')}
        </div>
        <div class="money-card-sub">${txs.length} transacciones</div>
      </div>
      <div class="money-card">
        <div class="money-card-lbl">Ingresos</div>
        <div class="money-card-num income">+$${income.toLocaleString('es')}</div>
        <div class="money-card-sub">${txs.filter(t => t.type === 'income').length} registros</div>
      </div>
      <div class="money-card">
        <div class="money-card-lbl">Gastos</div>
        <div class="money-card-num expense">-$${expense.toLocaleString('es')}</div>
        <div class="money-card-sub">${txs.filter(t => t.type === 'expense').length} registros</div>
      </div>`;
  }

  const listEl = document.getElementById('tx-list');
  if (!listEl) return;
  if (txs.length === 0) {
    listEl.innerHTML = '<div style="padding:28px;text-align:center;color:var(--text3);font-style:italic;font-size:0.85rem">Sin transacciones — ¡comienza a registrar! ✦</div>';
    return;
  }
  listEl.innerHTML = [...txs].reverse().slice(0, 40).map(t => `
    <div class="tx-item">
      <div class="tx-icon" style="background:${t.type === 'income' ? 'rgba(143,175,138,0.15)' : 'rgba(232,164,168,0.15)'}">
        ${MONEY_ICONS[t.cat] || '📦'}
      </div>
      <div class="tx-info">
        <div class="tx-desc">${esc(t.desc)}</div>
        <div class="tx-cat">${t.cat} · ${fmtDate(t.date)}</div>
      </div>
      <div class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}$${t.amount.toLocaleString('es')}</div>
      <button class="tx-del" onclick="deleteTx('${t.id}')">✕</button>
    </div>`).join('');
}

function addTransaction() {
  const descEl   = document.getElementById('money-desc');
  const amountEl = document.getElementById('money-amount');
  const typeEl   = document.getElementById('money-type');
  const catEl    = document.getElementById('money-cat');

  const desc   = descEl   ? descEl.value.trim()          : '';
  const amount = amountEl ? parseFloat(amountEl.value)   : NaN;

  if (!desc || !amount || isNaN(amount) || amount <= 0) {
    toast('Completa descripción y monto válido');
    return;
  }
  S.transactions.push({
    id:     uid(),
    desc,
    amount: Math.abs(amount),
    type:   typeEl ? typeEl.value : 'expense',
    cat:    catEl  ? catEl.value  : 'otro',
    date:   new Date().toISOString(),
  });
  if (descEl)   descEl.value   = '';
  if (amountEl) amountEl.value = '';
  saveState();
  renderMoney();
  toast('Transacción agregada ✦');
}

function deleteTx(id) {
  S.transactions = S.transactions.filter(t => t.id !== id);
  saveState();
  renderMoney();
}

// ══════════════════════════════════════════════════════════════════════════════
// LISTAS
// ══════════════════════════════════════════════════════════════════════════════

function renderLists() {
  const grid = document.getElementById('lists-grid');
  if (!grid) return;
  if (S.lists.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">≡</span><div class="empty-state-title">Sin listas</div><div class="empty-state-sub">Crea tu primera lista ✦</div></div>';
    return;
  }
  grid.innerHTML = S.lists.map(list => `
    <div class="list-card">
      <div class="list-card-head">
        <div class="list-card-title">${list.emoji} ${esc(list.title)}</div>
        <button class="btn" style="padding:5px 10px;font-size:0.75rem" onclick="deleteList('${list.id}')">✕</button>
      </div>
      <div class="list-card-body">
        ${list.items.map(item => `
          <div class="list-item${item.done ? ' done' : ''}">
            <button class="list-check" onclick="toggleListItem('${list.id}','${item.id}')">${item.done ? '✓' : ''}</button>
            <span class="list-text">${esc(item.text)}</span>
            <button class="list-del" onclick="deleteListItem('${list.id}','${item.id}')">✕</button>
          </div>`).join('')}
        ${list.items.length === 0 ? '<div style="color:var(--text3);font-size:0.78rem;font-style:italic;padding:8px 4px">Vacía — agrega algo ✦</div>' : ''}
        <div class="list-add-row">
          <input class="list-add-input" id="li-${list.id}" placeholder="Agregar item..."
            onkeydown="if(event.key==='Enter')addListItem('${list.id}')"/>
          <button class="list-add-btn" onclick="addListItem('${list.id}')">+</button>
        </div>
      </div>
    </div>`).join('');
}

function addListItem(listId) {
  const inp  = document.getElementById('li-' + listId);
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  const list = S.lists.find(l => l.id === listId);
  if (list) {
    list.items.push({ id: uid(), text, done: false });
    saveState();
    renderLists();
    setTimeout(() => {
      const el = document.getElementById('li-' + listId);
      if (el) el.focus();
    }, 40);
  }
}

function toggleListItem(listId, itemId) {
  const list = S.lists.find(l => l.id === listId);
  if (!list) return;
  const item = list.items.find(i => i.id === itemId);
  if (item) {
    item.done = !item.done;
    saveState();
    renderLists();
  }
}

function deleteListItem(listId, itemId) {
  const list = S.lists.find(l => l.id === listId);
  if (list) {
    list.items = list.items.filter(i => i.id !== itemId);
    saveState();
    renderLists();
  }
}

function addListDialog() {
  const title = prompt('Nombre de la lista:');
  if (!title || !title.trim()) return;
  const emoji = prompt('Emoji para la lista:', '📋') || '📋';
  S.lists.push({ id: uid(), title: title.trim(), emoji, items: [] });
  saveState();
  renderLists();
  toast('Lista "' + title.trim() + '" creada ✦');
}

function deleteList(id) {
  if (!confirm('¿Eliminar esta lista y todo su contenido?')) return;
  S.lists = S.lists.filter(l => l.id !== id);
  saveState();
  renderLists();
}

// ══════════════════════════════════════════════════════════════════════════════
// CURSOR PERSONALIZADO
// ══════════════════════════════════════════════════════════════════════════════

const cursorDot  = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursorDot) { cursorDot.style.left = mouseX + 'px'; cursorDot.style.top = mouseY + 'px'; }
});

setInterval(() => {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  if (cursorRing) { cursorRing.style.left = ringX + 'px'; cursorRing.style.top = ringY + 'px'; }
}, 16);

document.querySelectorAll('button, a, input, textarea, select, [contenteditable]').forEach(el => {
  el.addEventListener('mouseenter', () => {
    if (cursorDot)  { cursorDot.style.width  = '5px'; cursorDot.style.height  = '5px'; }
    if (cursorRing) { cursorRing.style.width = '48px'; cursorRing.style.height = '48px'; cursorRing.style.opacity = '0.6'; }
  });
  el.addEventListener('mouseleave', () => {
    if (cursorDot)  { cursorDot.style.width  = '10px'; cursorDot.style.height  = '10px'; }
    if (cursorRing) { cursorRing.style.width = '36px'; cursorRing.style.height = '36px'; cursorRing.style.opacity = '1'; }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════════

// nombre de usuario desde sidebar
const userNameEl = document.getElementById('sidebar-username');
if (userNameEl) userNameEl.textContent = S.userName;

// render inicial
renderDashboard();
updatePomoUI();

console.log('🌸 Bloom cargado correctamente');
