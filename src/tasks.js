// Чистые функции без обращения к DOM и хранилищу: так их легко тестировать

export function normalize(text) {
  return text.trim().replace(/\s+/g, ' ');
}

// Ключ для сравнения: «Купить  хлеб» и «купить хлеб» считаются одной задачей
const compareKey = (text) => normalize(text).toLocaleLowerCase('ru');

export function addTask(tasks, text, id = crypto.randomUUID()) {
  const clean = normalize(text);
  if (!clean) return { ok: false, reason: 'empty' };

  const existing = tasks.find((t) => compareKey(t.text) === compareKey(clean));
  if (existing) return { ok: false, reason: 'duplicate', existing };

  return { ok: true, tasks: [{ id, text: clean, done: false }, ...tasks] };
}

export const toggleTask = (tasks, id) =>
  tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));

export const removeTask = (tasks, id) => tasks.filter((t) => t.id !== id);

export const clearDone = (tasks) => tasks.filter((t) => !t.done);

export function filterTasks(tasks, filter) {
  if (filter === 'active') return tasks.filter((t) => !t.done);
  if (filter === 'done') return tasks.filter((t) => t.done);
  return tasks;
}

export function getStats(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  return { total, done, left: total - done, percent: total ? Math.round((done / total) * 100) : 0 };
}
