import { describe, it, expect } from 'vitest';

describe('Sample Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to Chrome API mocks', () => {
    expect(chrome).toBeDefined();
    expect(chrome.storage).toBeDefined();
    expect(chrome.storage.sync.get).toBeDefined();
  });
});