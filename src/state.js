// ════════════════════════════════════════════════════════════
// APP STATE — Simple reactive state management
// ════════════════════════════════════════════════════════════

const state = {
  me: null,
  lb: [],
  todayTasks: [],
  settings: null,
  allTasks: [],
  loaded: false,
  currentTab: 'today',
  onboardingDone: true,
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(updates) {
  Object.assign(state, updates);
  listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
