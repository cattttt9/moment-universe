import { describe, expect, it } from 'vitest';
import { parseHistory } from '../stores/historyStore';

describe('history parsing', () => {
  it('recovers safely from invalid JSON', () => {
    expect(parseHistory('{not-json')).toEqual([]);
  });

  it('drops malformed records', () => {
    expect(parseHistory(JSON.stringify([{ version: 1, savedAt: 'x', config: null }]))).toEqual([]);
  });
});
