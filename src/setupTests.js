// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';

const storage = new Map();
const localStorageMock = {
  get length() {
    return storage.size;
  },
  clear() {
    storage.clear();
  },
  getItem(key) {
    return storage.has(String(key)) ? storage.get(String(key)) : null;
  },
  key(index) {
    return Array.from(storage.keys())[index] ?? null;
  },
  removeItem(key) {
    storage.delete(String(key));
  },
  setItem(key, value) {
    storage.set(String(key), String(value));
  },
};

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorageMock,
});
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: localStorageMock,
});
