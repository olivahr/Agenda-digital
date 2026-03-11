/* ═══════════════════════════════════════════════════════════════
   BLOOM - App Logic Completo
   Agenda real, persistencia, calendario, todo funcional
═══════════════════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'bloom_agenda_v2';

const MOODS = {
  amazing: { emoji: '🤩', label: 'Increíble', color: '#E8A4A8' },
  good: { emoji: '😊', label: 'Bien', color: '#D4A96A' },
  okay: { emoji: '😐', label: 'Normal', color: '#8AB8D4' },
  tired: { emoji: '😴', label: 'Cansada', color: '#B4A8D0' },
  sad: { emoji: '😔', label: 'Triste', color: '#8FA890' },
  stressed: { emoji: '😰', label: 'Estresada', color: '#D4906A' }
};

const CATEGORIES = {
  personal: { label: 'Personal', emoji: '👤', color: '#B4A8D0' },
  work: { label: 'Trabajo', emoji: '💼', color: '#D4A96A' },
  health: { label: 'Salud', emoji: '❤️', color: '#8FAF8A' },
  home: { label: 'Hogar', emoji: '🏠', color: '#E8C4A0' },
  study: { label: 'Estudio', emoji: '📚', color: '#8AB8D4' },
  social: { label: 'Social', emoji: '👥', color: '#E8A4A8' }
};

const QUOTES = [
  "Cada día es una nueva oportunidad para brillar ✨",
  "Eres más fuerte de lo que crees 💪",
  "El progreso, no la perfección 🌱",
  "Hoy es un buen día para empezar 🌸",
  "Confía en el proceso ✨",
  "Pequeños pasos, grandes cambios 🦋",
  "Tu esfuerzo tiene nombre: progreso 🌟"
];

const FOCUS_MODES = {
  work: { minutes: 25, label: 'Trabajo' },
  short: { minutes: 5, label: 'Descanso' },
  long: { minutes: 15, label: 'Descanso Largo' }
};

// ═══════════════════════════════════════════════════════════════
// ESTADO
// ═══════════════════════════════════════════════════════════════

let state = loadState();
let currentView = 'today';
let selectedDate = new Date();
let currentMonth = new Date();
let taskFilter = 'all';
let focusMode = 'work';
let focusTimeLeft = 25 * 60;
let focusRunning = false;
let focusInterval = null;

function defaultState() {
  return {
    tasks: [],
    habits: [
      { id: 'water', name: 'Tomar agua', icon: '💧', history: {} },
      { id: 'exercise', name: 'Ejercicio', icon: '🏃‍♀️', history: {} },
      { id: 'read', name: 'Leer', icon: '📖', history: {} },
      { id: 'meditate', name: 'Meditar', icon: '🧘‍♀️', history: {} }
    ],
    notes: [],
    moods: {},
    focus: { sessions: 0, minutes: 0, lastDate: null },
    settings: { userName: 'Mi Agenda', quoteIndex: 0 }
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultState(), ...parsed };
    }
  } catch (e) {
    console.error('Error loading:', e);
  }
  return defaultState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving:', e);
    alert('Error al guardar datos');
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

const uid = () => Math.random().toString(36).substr(2, 9);
const todayKey = () => new Date().toISOString().split('T')[0];
const formatDate = (date) => date.toISOString().split('T')[0];
const formatDisplayDate = (date) => date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const formatShortDate = (date) => date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function shakeElement(el) {
  el.style.transform = 'translateX(10px)';
  setTimeout(() => el.style.transform = 'translateX(-10px)', 100);
  setTimeout(() => el.style.transform = 'translateX(5px)', 200);
  setTimeout(() => el.style.transform = 'translateX(0)', 300);
}

// ═══════════════════════════════════════════════════════════════
// INICIO
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    document.getElementById('splash').style.visibility = 'hidden';
    document.getElementById('app').classList.remove('hidden');
  }, 1500);

  initApp();
});

function initApp() {
  updateHeaderDate();
  renderToday();
  setupEventListeners();
  checkNewDay();
  
  // Pedir permiso de notificaciones
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function checkNewDay() {
  const today = todayKey();
  if (state.focus.lastDate !== today) {
    state.focus.sessions = 0;
    state.focus.minutes = 0;
    state.focus.lastDate = today;
    saveState();
  }
}

function updateHeaderDate() {
  const date = new Date();
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  document.getElementById('current-date').textContent = date.toLocaleDateString('es-ES', options);
}

function setupEventListeners() {
  document.getElementById('task-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
  
  // Cerrar modales al hacer click fuera
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// NAVEGACIÓN
// ═══════════════════════════════════════════════════════════════

function toggleMenu() {
  const menu = document.getElementById('side-menu');
  const overlay = document.getElementById('overlay');
  menu.classList.toggle('open');
  overlay.classList.toggle('show');
}

function switchView(viewName) {
  currentView = viewName;
  
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });
  
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewName}`)?.classList.add('active');
  
  const titles = {
    today: 'Hoy',
    calendar: 'Calendario',
    week: 'Esta Semana',
    tasks: 'Todas las Tareas',
    habits: 'Hábitos',
    notes: 'Notas',
    mood: 'Estado de Ánimo',
    focus: 'Modo Foco'
  };
  document.getElementById('current-view-title').textContent = titles[viewName] || 'Bloom';
  
  toggleMenu();
  renderView(viewName);
}

function renderView(viewName) {
  switch(viewName) {
    case 'today': renderToday(); break;
    case 'calendar': renderCalendar(); break;
    case 'week': renderWeek(); break;
    case 'tasks': renderAllTasks(); break;
    case 'habits': renderHabits(); break;
    case 'notes': renderNotes(); break;
    case 'mood': renderMood(); break;
    case 'focus': renderFocus(); break;
  }
}

function updateBadges() {
  const today = todayKey();
  const pending = state.tasks.filter(t => t.date === today && !t.completed).length;
  document.getElementById('badge-today').textContent = pending;
  document.getElementById('badge-tasks').textContent = state.tasks.filter(t => !t.completed).length;
}

// ═══════════════════════════════════════════════════════════════
// VISTA: HOY
// ═══════════════════════════════════════════════════════════════

function renderToday() {
  const today = todayKey();
  
  document.getElementById('greeting').textContent = getGreeting();
  document.getElementById('daily-quote').textContent = QUOTES[state.settings.quoteIndex % QUOTES.length];
  
  const todayTasks = state.tasks.filter(t => t.date === today);
  const completed = todayTasks.filter(t => t.completed).length;
  const total = todayTasks.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  document.getElementById('today-percent').textContent = percent + '%';
  document.getElementById('today-done').textContent = completed;
  document.getElementById('today-total').textContent = total;
  
  const circle = document.getElementById('today-progress');
  const circumference = 339.292;
  const offset = circumference - (percent / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  
  const list = document.getElementById('today-tasks-list');
  if (todayTasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌸</div>
        <div class="empty-title">¡Día libre!</div>
        <div class="empty-subtitle">Agrega tu primera tarea del día</div>
      </div>
    `;
  } else {
    list.innerHTML = todayTasks.sort((a, b) => a.completed - b.completed).map(task => renderTaskHTML(task)).join('');
  }
  
  updateBadges();
}

function renderTaskHTML(task) {
  const cat = CATEGORIES[task.category] || CATEGORIES.personal;
  return `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <button class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')">
        ${task.completed ? '✓' : ''}
      </button>
      <div class="task-content">
        <div class="task-text">${escapeHtml(task.text)}</div>
        <div class="task-meta">
          <span class="task-category ${task.category}">${cat.emoji} ${cat.label}</span>
          <span class="task-priority ${task.priority}"></span>
        </div>
      </div>
      <button class="task-delete" onclick="deleteTask('${task.id}')">×</button>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// TAREAS
// ═══════════════════════════════════════════════════════════════

function showAddModal(type = 'task') {
  if (type === 'task') {
    document.getElementById('modal-add').classList.add('show');
    document.getElementById('task-input').value = '';
    document.getElementById('task-date').value = formatDate(selectedDate);
    setTimeout(() => document.getElementById('task-input').focus(), 100);
  }
}

function hideModal(modalName) {
  document.getElementById(`modal-${modalName}`).classList.remove('show');
}

function addTask() {
  const text = document.getElementById('task-input').value.trim();
  const category = document.getElementById('task-category').value;
  const priority = document.getElementById('task-priority').value;
  const date = document.getElementById('task-date').value || todayKey();
  
  if (!text) {
    shakeElement(document.getElementById('task-input'));
    return;
  }
  
  const task = {
    id: uid(),
    text,
    category,
    priority,
    date,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  state.tasks.push(task);
  saveState();
  hideModal('add');
  renderView(currentView);
  
  if (navigator.vibrate) navigator.vibrate(50);
}

function toggleTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  task.completed = !task.completed;
  saveState();
  renderView(currentView);
  
  if (task.completed && navigator.vibrate) {
    navigator.vibrate([50, 50, 50]);
  }
}

function deleteTask(taskId) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  
  state.tasks = state.tasks.filter(t => t.id !== taskId);
  saveState();
  renderView(currentView);
}

// ═══════════════════════════════════════════════════════════════
// CALENDARIO
// ═══════════════════════════════════════════════════════════════

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  document.getElementById('calendar-month').textContent = `${monthNames[month]} ${year}`;
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  
  // Días anteriores
  for (let i = firstDay - 1; i >= 0; i--) {
    const btn = createDayButton(daysInPrevMonth - i, true);
    grid.appendChild(btn);
  }
  
  // Días actuales
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = formatDate(date);
    const isToday = dateKey === todayKey();
    const isSelected = dateKey === formatDate(selectedDate);
    const hasTasks = state.tasks.some(t => t.date === dateKey);
    const mood = state.moods[dateKey];
    
    const btn = createDayButton(day, false, isToday, isSelected, hasTasks, mood);
    btn.onclick = () => selectDate(date);
    grid.appendChild(btn);
  }
  
  // Días siguientes
  const remaining = (7 - ((firstDay + daysInMonth) % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    grid.appendChild(createDayButton(day, true));
  }
  
  renderSelectedDayTasks();
}

function createDayButton(day, otherMonth, isToday = false, isSelected = false, hasTasks = false, mood = null) {
  const btn = document.createElement('button');
  btn.className = 'calendar-day';
  if (otherMonth) btn.classList.add('other-month');
  if (isToday) btn.classList.add('today');
  if (isSelected) btn.classList.add('selected');
  if (hasTasks) btn.classList.add('has-tasks');
  
  btn.innerHTML = `
    <span class="day-number">${day}</span>
    ${mood ? `<span class="day-mood">${MOODS[mood.mood]?.emoji || ''}</span>` : ''}
  `;
  
  return btn;
}

function selectDate(date) {
  selectedDate = date;
  renderCalendar();
}

function changeMonth(delta) {
  currentMonth.setMonth(currentMonth.getMonth() + delta);
  renderCalendar();
}

function renderSelectedDayTasks() {
  const dateKey = formatDate(selectedDate);
  const dayTasks = state.tasks.filter(t => t.date === dateKey);
  
  document.getElementById('selected-date-label').textContent = formatDisplayDate(selectedDate);
  
  const container = document.getElementById('selected-day-tasks');
  if (dayTasks.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding: 20px"><div class="empty-subtitle">Sin tareas este día</div></div>';
  } else {
    container.innerHTML = dayTasks.map(task => renderTaskHTML(task)).join('');
  }
}

function showAddModalForSelectedDay() {
  document.getElementById('task-date').value = formatDate(selectedDate);
  showAddModal('task');
}

// ═══════════════════════════════════════════════════════════════
// SEMANA
// ═══════════════════════════════════════════════════════════════

function renderWeek() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  document.getElementById('week-range').textContent = 
    `${formatShortDate(startOfWeek)} - ${formatShortDate(endOfWeek)}`;
  
  const grid = document.getElementById('week-grid');
  grid.innerHTML = '';
  
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateKey = formatDate(date);
    const isToday = dateKey === todayKey();
    const dayTasks = state.tasks.filter(t => t.date === dateKey);
    
    const dayEl = document.createElement('div');
    dayEl.className = 'week-day';
    dayEl.innerHTML = `
      <div class="week-day-header">
        <span class="week-day-name">${isToday ? 'Hoy' : dayNames[i]}</span>
        <span class="week-day-date">${date.getDate()}</span>
      </div>
      <div class="week-day-tasks">
        ${dayTasks.length === 0 ? 
          '<div class="empty-subtitle" style="padding: 10px 0">Sin tareas</div>' :
          dayTasks.map(t => `
            <div class="week-task ${t.completed ? 'completed' : ''}">
              <span>${t.completed ? '✓' : '○'}</span>
              <span>${escapeHtml(t.text)}</span>
            </div>
          `).join('')
        }
      </div>
    `;
    grid.appendChild(dayEl);
  }
}

// ═══════════════════════════════════════════════════════════════
// TODAS LAS TAREAS
// ═══════════════════════════════════════════════════════════════

function renderAllTasks() {
  let filtered = state.tasks;
  
  if (taskFilter === 'pending') filtered = filtered.filter(t => !t.completed);
  if (taskFilter === 'completed') filtered = filtered.filter(t => t.completed);
  
  filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(b.date) - new Date(a.date);
  });
  
  const list = document.getElementById('all-tasks-list');
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">No hay tareas</div>
      </div>
    `;
  } else {
    list.innerHTML = filtered.map(task => renderTaskHTML(task)).join('');
  }
}

function filterTasks(filter) {
  taskFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', 
      (filter === 'all' && btn.textContent.includes('Todas')) ||
      (filter === 'pending' && btn.textContent.includes('Pendientes')) ||
      (filter === 'completed' && btn.textContent.includes('Completadas'))
    );
  });
  renderAllTasks();
}

// ═══════════════════════════════════════════════════════════════
// HÁBITOS
// ═══════════════════════════════════════════════════════════════

function renderHabits() {
  let globalStreak = 0;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = formatDate(date);
    
    const anyHabit = state.habits.some(h => h.history[key]);
    if (anyHabit) {
      globalStreak++;
    } else if (i > 0) {
      break;
    }
  }
  
  document.getElementById('habits-streak').innerHTML = `
    <div class="streak-number">${globalStreak}</div>
    <div class="streak-label">días de racha 🔥</div>
  `;
  
  const list = document.getElementById('habits-list');
  const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  
  list.innerHTML = state.habits.map(habit => {
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      if (habit.history[formatDate(date)]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return `
      <div class="habit-item">
        <div class="habit-header">
          <div class="habit-icon">${habit.icon}</div>
          <div class="habit-info">
            <div class="habit-name">${habit.name}</div>
            <div class="habit-streak">${streak} días seguidos ${streak >= 3 ? '🔥' : ''}</div>
          </div>
        </div>
        <div class="habit-week">
          ${Array.from({length: 7}, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - today.getDay() + i);
            const key = formatDate(date);
            const done = habit.history[key];
            return `
              <button class="habit-day-btn ${done ? 'done' : ''}" 
                onclick="toggleHabit('${habit.id}', '${key}')">
                ${weekDays[i]}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function toggleHabit(habitId, dateKey) {
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;
  
  habit.history[dateKey] = !habit.history[dateKey];
  saveState();
  renderHabits();
  
  if (habit.history[dateKey] && navigator.vibrate) {
    navigator.vibrate(50);
  }
}

function showAddHabitModal() {
  const name = prompt('Nombre del hábito:');
  if (!name) return;
  
  const icon = prompt('Emoji (opcional):', '✨') || '✨';
  
  state.habits.push({
    id: uid(),
    name,
    icon,
    history: {}
  });
  
  saveState();
  renderHabits();
}

// ═══════════════════════════════════════════════════════════════
// NOTAS
// ═══════════════════════════════════════════════════════════════

function renderNotes() {
  const grid = document.getElementById('notes-grid');
  
  if (state.notes.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">📝</div>
        <div class="empty-title">Sin notas aún</div>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = state.notes.map(note => `
    <div class="note-card" onclick="viewNote('${note.id}')">
      <div class="note-title">${escapeHtml(note.title) || 'Sin título'}</div>
      <div class="note-preview">${escapeHtml(note.content)}</div>
      <div class="note-date">${formatShortDate(new Date(note.updatedAt))}</div>
    </div>
  `).join('');
}

function showAddNoteModal() {
  document.getElementById('modal-note').classList.add('show');
  document.getElementById('note-title-input').value = '';
  document.getElementById('note-content-input').value = '';
  setTimeout(() => document.getElementById('note-title-input').focus(), 100);
}

function addNote() {
  const title = document.getElementById('note-title-input').value.trim();
  const content = document.getElementById('note-content-input').value.trim();
  
  if (!title && !content) {
    hideModal('note');
    return;
  }
  
  state.notes.unshift({
    id: uid(),
    title: title || 'Sin título',
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  saveState();
  hideModal('note');
  renderNotes();
}

function viewNote(noteId) {
  const note = state.notes.find(n => n.id === noteId);
  if (!note) return;
  
  const newContent = prompt('Editar nota:', note.content);
  if (newContent === null) return;
  
  note.content = newContent;
  note.updatedAt = new Date().toISOString();
  saveState();
  renderNotes();
}

// ═══════════════════════════════════════════════════════════════
// ESTADO DE ÁNIMO
// ═══════════════════════════════════════════════════════════════

function renderMood() {
  document.getElementById('mood-date').textContent = formatDisplayDate(new Date());
  
  const todayMood = state.moods[todayKey()];
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.mood === todayMood?.mood);
  });
  
  document.getElementById('mood-note-text').value = todayMood?.note || '';
  
  const history = Object.entries(state.moods)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);
  
  const container = document.getElementById('mood-history');
  if (history.length === 0) {
    container.innerHTML = '<div class="empty-subtitle" style="text-align: center; padding: 20px;">Sin registros aún</div>';
  } else {
    container.innerHTML = history.map(([date, data]) => {
      const mood = MOODS[data.mood];
      return `
        <div class="mood-entry">
          <span class="mood-entry-emoji">${mood?.emoji || '😐'}</span>
          <div class="mood-entry-info">
            <div class="mood-entry-date">${formatDisplayDate(new Date(date))}</div>
            ${data.note ? `<div class="mood-entry-note">${escapeHtml(data.note)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}

function selectMood(moodId) {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.mood === moodId);
  });
}

function saveMood() {
  const selected = document.querySelector('.mood-btn.selected');
  if (!selected) {
    alert('Selecciona cómo te sientes');
    return;
  }
  
  const mood = selected.dataset.mood;
  const note = document.getElementById('mood-note-text').value.trim();
  
  state.moods[todayKey()] = { mood, note };
  saveState();
  renderMood();
  
  if (navigator.vibrate) navigator.vibrate(50);
}

function logMood() {
  switchView('mood');
}

// ═══════════════════════════════════════════════════════════════
// MODO FOCO (POMODORO)
// ═══════════════════════════════════════════════════════════════

function renderFocus() {
  updateTimerDisplay();
  document.getElementById('focus-sessions').textContent = state.focus.sessions;
  document.getElementById('focus-minutes').textContent = state.focus.minutes;
}

function setFocusMode(mode) {
  if (focusRunning) toggleTimer();
  
  focusMode = mode;
  focusTimeLeft = FOCUS_MODES[mode].minutes * 60;
  
  document.querySelectorAll('.focus-mode').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === FOCUS_MODES[mode].label);
  });
  
  updateTimerDisplay();
}

function toggleTimer() {
  if (focusRunning) {
    clearInterval(focusInterval);
    focusRunning = false;
    document.getElementById('timer-toggle').textContent = '▶';
  } else {
    focusRunning = true;
    document.getElementById('timer-toggle').textContent = '⏸';
    focusInterval = setInterval(() => {
      focusTimeLeft--;
      updateTimerDisplay();
      
      if (focusTimeLeft <= 0) {
        onTimerComplete();
      }
    }, 1000);
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(focusTimeLeft / 60);
  const secs = focusTimeLeft % 60;
  
  document.getElementById('timer-minutes').textContent = String(mins).padStart(2, '0');
  document.getElementById('timer-seconds').textContent = String(secs).padStart(2, '0');
  
  const total = FOCUS_MODES[focusMode].minutes * 60;
  const progress = (total - focusTimeLeft) / total;
  const circumference = 565.487;
  const offset = circumference * progress;
  document.getElementById('timer-progress').style.strokeDashoffset = offset;
}

function onTimerComplete() {
  clearInterval(focusInterval);
  focusRunning = false;
  document.getElementById('timer-toggle').textContent = '▶';
  
  if (focusMode === 'work') {
    state.focus.sessions++;
    state.focus.minutes += 25;
    saveState();
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('¡Sesión completada!', {
        body: 'Tomate un descanso bien merecido 🌸'
      });
    }
  }
  
  renderFocus();
}

function resetTimer() {
  clearInterval(focusInterval);
  focusRunning = false;
  focusTimeLeft = FOCUS_MODES[focusMode].minutes * 60;
  document.getElementById('timer-toggle').textContent = '▶';
  updateTimerDisplay();
}

function skipTimer() {
  resetTimer();
}

// ═══════════════════════════════════════════════════════════════
// BACKUP / IMPORT
// ═══════════════════════════════════════════════════════════════

function exportData() {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `bloom-backup-${todayKey()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  alert('Backup guardado ✅');
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (confirm('¿Reemplazar todos los datos actuales?')) {
        state = { ...defaultState(), ...imported };
        saveState();
        location.reload();
      }
    } catch (err) {
      alert('Error al cargar archivo');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// Console log
console.log('🌸 Bloom cargado - Listo para usar');
