export const STORAGE_KEY = 'todo-data';
// Через сколько миллисекунд без изменений список очищается (7 дней)
export const TTL = 7 * 24 * 60 * 60 * 1000;

export function loadTasks(now = Date.now(), storage = localStorage) {
  try {
    const data = JSON.parse(storage.getItem(STORAGE_KEY));
    const valid = data && Array.isArray(data.tasks) && typeof data.savedAt === 'number';
    if (!valid || now - data.savedAt > TTL) {
      storage.removeItem(STORAGE_KEY);
      return [];
    }
    return data.tasks;
  } catch {
    // Битый JSON или недоступное хранилище не должны ломать приложение
    return [];
  }
}

// Время обновляется при каждом сохранении, поэтому срок считается от последнего действия
export function saveTasks(tasks, now = Date.now(), storage = localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: now, tasks }));
  } catch {
    // Переполненное хранилище или приватный режим: работаем без сохранения
  }
}
