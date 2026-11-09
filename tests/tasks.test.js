import { describe, it, expect } from 'vitest';
import { addTask, toggleTask, removeTask, clearDone, filterTasks, getStats, normalize } from '../src/tasks.js';

const sample = [
  { id: '1', text: 'Купить хлеб', done: false },
  { id: '2', text: 'Позвонить маме', done: true }
];

describe('addTask', () => {
  it('добавляет задачу в начало списка', () => {
    const result = addTask([], 'Новая', 'id-1');
    expect(result.ok).toBe(true);
    expect(result.tasks).toEqual([{ id: 'id-1', text: 'Новая', done: false }]);
  });

  it('генерирует id, если он не передан', () => {
    expect(addTask([], 'Задача').tasks[0].id).toBeTruthy();
  });

  it('обрезает и схлопывает пробелы', () => {
    expect(addTask([], '  много   пробелов  ', 'x').tasks[0].text).toBe('много пробелов');
  });

  it('отклоняет пустой ввод', () => {
    expect(addTask(sample, '   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('отклоняет дубликат без учёта регистра и лишних пробелов', () => {
    const result = addTask(sample, '  купить   ХЛЕБ ');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('duplicate');
    expect(result.existing.id).toBe('1');
  });

  it('находит дубликат среди выполненных задач', () => {
    expect(addTask(sample, 'позвонить маме').existing.done).toBe(true);
  });

  it('не изменяет исходный массив', () => {
    addTask(sample, 'Другая', 'x');
    expect(sample).toHaveLength(2);
  });
});

describe('операции над списком', () => {
  it('toggleTask переключает только нужную задачу', () => {
    const next = toggleTask(sample, '1');
    expect(next[0].done).toBe(true);
    expect(next[1].done).toBe(true);
    expect(toggleTask(next, '1')[0].done).toBe(false);
  });

  it('removeTask удаляет задачу по id', () => {
    expect(removeTask(sample, '1').map((t) => t.id)).toEqual(['2']);
  });

  it('clearDone убирает выполненные', () => {
    expect(clearDone(sample).map((t) => t.id)).toEqual(['1']);
  });

  it('filterTasks фильтрует по статусу', () => {
    expect(filterTasks(sample, 'all')).toHaveLength(2);
    expect(filterTasks(sample, 'active').map((t) => t.id)).toEqual(['1']);
    expect(filterTasks(sample, 'done').map((t) => t.id)).toEqual(['2']);
  });
});

describe('getStats', () => {
  it('считает прогресс', () => {
    expect(getStats(sample)).toEqual({ total: 2, done: 1, left: 1, percent: 50 });
  });

  it('не делит на ноль для пустого списка', () => {
    expect(getStats([]).percent).toBe(0);
  });
});

it('normalize работает со строками из одних пробелов', () => {
  expect(normalize('   ')).toBe('');
});
