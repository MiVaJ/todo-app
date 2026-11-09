import { addTask, toggleTask, removeTask, clearDone, filterTasks, getStats } from './tasks.js';
import { loadTasks, saveTasks } from './storage.js';

const $ = (id) => document.getElementById(id);
const form = $('add-form');
const input = $('task-input');
const errorEl = $('form-error');
const listEl = $('task-list');
const emptyEl = $('empty');
const RING_LENGTH = 2 * Math.PI * 36;

let tasks = loadTasks();
let filter = 'all';
let newestId = null; // анимация появления нужна только для свежей задачи

const EMPTY_TEXT = {
  all: 'Список пуст. Добавьте первую задачу.',
  active: 'Все задачи выполнены.',
  done: 'Выполненных задач пока нет.'
};

// Страница скрыта, пока не загрузится шрифт: так нет скачка с системного шрифта на Manrope.
// Таймаут нужен, чтобы медленная сеть не оставила пользователя перед пустым экраном.
function revealWhenReady() {
  const fonts = Promise.all([
    document.fonts.load('500 1em "Manrope Variable"', 'Aa'),
    document.fonts.load('500 1em "Manrope Variable"', 'Аа')
  ]);
  Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))])
    .finally(() => document.documentElement.classList.add('ready'));
}

function update(next) {
  const before = getStats(tasks);
  tasks = next;
  saveTasks(tasks);
  render();
  const after = getStats(tasks);
  if (after.total > 0 && after.percent === 100 && before.percent < 100) celebrate();
}

function setFilter(value) {
  filter = value;
  document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c.dataset.filter === value));
}

function render() {
  const visible = filterTasks(tasks, filter);
  listEl.replaceChildren(...visible.map(createItem));
  newestId = null;

  const { total, left, percent } = getStats(tasks);
  $('percent').textContent = `${percent}%`;
  $('ring').style.strokeDashoffset = RING_LENGTH * (1 - percent / 100);
  $('summary').textContent = total ? `Осталось выполнить: ${left} из ${total}` : 'Пока ничего не запланировано';

  emptyEl.hidden = visible.length > 0;
  emptyEl.textContent = EMPTY_TEXT[filter];
}

function createItem(task) {
  const li = document.createElement('li');
  li.className = 'task' + (task.done ? ' is-done' : '') + (task.id === newestId ? ' enter' : '');
  li.dataset.id = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.setAttribute('aria-label', 'Отметить выполненной');

  const text = document.createElement('span');
  text.className = 'task-text';
  text.textContent = task.text; // textContent, чтобы введённый HTML не выполнялся

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete';
  del.setAttribute('aria-label', 'Удалить задачу');
  del.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';

  li.append(checkbox, text, del);
  return li;
}

function showError(message) {
  errorEl.textContent = message;
  form.classList.remove('shake');
  void form.offsetWidth; // перезапуск анимации при повторной ошибке
  form.classList.add('shake');
}

function highlight(id) {
  const li = listEl.querySelector(`[data-id="${id}"]`);
  if (!li) return;
  li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  li.classList.add('flash');
}

function celebrate() {
  const colors = ['var(--accent)', 'var(--accent-2)', '#f5b83d', '#ef6f6c'];
  const ring = document.querySelector('.ring');
  for (let i = 0; i < 28; i++) {
    const piece = document.createElement('i');
    piece.className = 'confetti';
    piece.style.cssText = `--x:${(Math.random() - 0.5) * 520}px;--y:${-120 - Math.random() * 260}px;` +
      `--r:${Math.random() * 720}deg;background:${colors[i % colors.length]};`;
    ring.append(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const result = addTask(tasks, input.value);

  if (result.reason === 'empty') {
    showError('Введите название задачи.');
  } else if (result.reason === 'duplicate') {
    showError(result.existing.done ? 'Такая задача уже есть среди выполненных.' : 'Такая задача уже есть в списке.');
    setFilter('all'); // иначе дубликат может оказаться скрытым фильтром
    render();
    highlight(result.existing.id);
  } else {
    errorEl.textContent = '';
    input.value = '';
    newestId = result.tasks[0].id;
    update(result.tasks);
  }
});

input.addEventListener('input', () => { errorEl.textContent = ''; });

listEl.addEventListener('change', (e) => {
  update(toggleTask(tasks, e.target.closest('.task').dataset.id));
});

listEl.addEventListener('click', (e) => {
  if (!e.target.closest('.delete')) return;
  const li = e.target.closest('.task');
  li.classList.add('leaving');
  setTimeout(() => update(removeTask(tasks, li.dataset.id)), 180);
});

listEl.addEventListener('animationend', (e) => {
  if (e.animationName === 'flash') e.target.classList.remove('flash');
});

$('filters').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  setFilter(chip.dataset.filter);
  render();
});

$('clear-done').addEventListener('click', () => update(clearDone(tasks)));

$('theme-toggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('todo-theme', next);
});

$('ring').style.strokeDasharray = RING_LENGTH;
render();
revealWhenReady();
