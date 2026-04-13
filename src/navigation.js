import { haptic } from './lib/haptic.js';
import { tg, getTgUser } from './lib/telegram.js';
import { fmt } from './lib/utils.js';
import { getState, setState } from './state.js';
import { renderToday, loadTodayTasks, setFabVisible } from './pages/today.js';
import { renderProfile } from './pages/profile.js';
import { renderLeaderboard } from './pages/leaderboard.js';
import { renderBadges } from './pages/badges.js';
import { renderSettings } from './pages/settings.js';

const PAGES = {
  today: 'page-today',
  profile: 'page-profile',
  lb: 'page-lb',
  badges: 'page-badges',
  settings: 'page-settings',
};

export function initNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });
}

export function switchTab(tab) {
  const state = getState();
  if (tab === state.currentTab) return;
  haptic.select();

  // Activate page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(PAGES[tab])?.classList.add('active');

  // Activate tab button
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

  // BackButton
  if (tab === 'today') {
    tg?.BackButton?.hide();
  } else {
    tg?.BackButton?.show();
    tg?.BackButton?.onClick(() => switchTab('today'));
  }

  setState({ currentTab: tab });
  setupMainButton(tab);

  // Show FAB only on today tab
  setFabVisible(tab === 'today');

  // ── Lazy-load page content ──
  if (tab === 'today') {
    // Fetch fresh tasks then render
    loadTodayTasks().then(tasks => {
      setState({ todayTasks: tasks });
      renderToday(tasks);
    }).catch(() => renderToday(state.todayTasks || []));
  }
  if (tab === 'profile' && state.me) renderProfile(state.me);
  if (tab === 'lb') renderLeaderboard(state.lb, state.me);
  if (tab === 'badges' && state.me) renderBadges(state.me);
  if (tab === 'settings') renderSettings();
}

function setupMainButton(tab) {
  if (!tg?.MainButton) return;

  // Remove old click handlers by hiding and re-showing
  tg.MainButton.offClick?.(handleMainButtonClick);

  if (tab === 'today') {
    tg.MainButton.setParams({ text: 'Bota Dön', color: '#3ECF8E', text_color: '#ffffff' });
    tg.MainButton.show();
    tg.MainButton.onClick(handleMainButtonClick);
  } else if (tab === 'lb') {
    tg.MainButton.setParams({ text: '🏆 Sıralamayı Paylaş', color: '#5B8AF6', text_color: '#ffffff' });
    tg.MainButton.show();
    tg.MainButton.onClick(handleMainButtonClick);
  } else {
    tg.MainButton.hide();
  }
}

function handleMainButtonClick() {
  const state = getState();
  haptic.tap();

  if (state.currentTab === 'today') {
    tg.close();
  } else if (state.currentTab === 'lb' && state.me) {
    // Use the proper share function from leaderboard
    import('./pages/leaderboard.js').then(m => m.shareRanking(state.me));
  }
}
