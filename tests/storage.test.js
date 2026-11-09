import { describe, it, expect, beforeEach } from 'vitest';
import { loadTasks, saveTasks, STORAGE_KEY, TTL } from '../src/storage.js';

const tasks = [{ id: '1', text: 'Тест', done: false }];

beforeEach(() => localStorage.clear());

describe('storage', () => {
  it('возвращает пустой список, если ничего не сохранено', () => {
    expect(loadTasks()).toEqual([]);
  });

  it('сохраняет и загружает задачи', () => {
    saveTasks(tasks, 1000);
    expect(loadTasks(2000)).toEqual(tasks);
  });

  it('очищает данные старше TTL', () => {
    saveTasks(tasks, 0);
    expect(loadTasks(TTL + 1)).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('сохраняет данные ровно на границе TTL', () => {
    saveTasks(tasks, 0);
    expect(loadTasks(TTL)).toEqual(tasks);
  });

  it('продлевает срок при каждом сохранении', () => {
    saveTasks(tasks, 0);
    saveTasks(tasks, TTL - 1);
    expect(loadTasks(TTL * 1.5)).toEqual(tasks);
  });

  it('переживает повреждённые данные', () => {
    localStorage.setItem(STORAGE_KEY, '{не json');
    expect(loadTasks()).toEqual([]);
  });

  it('отбрасывает данные неверной структуры', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: 'строка' }));
    expect(loadTasks()).toEqual([]);
  });
});
