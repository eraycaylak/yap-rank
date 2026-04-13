// ════════════════════════════════════════════════════════════
// MAIN ENTRY POINT — YAP! Mini App
// ════════════════════════════════════════════════════════════

// ── Styles ────────────────────────────────────────────────
import './styles/base.css';
import './styles/nav.css';
import './styles/today.css';
import './styles/profile.css';
import './styles/leaderboard.css';
import './styles/badges.css';
import './styles/onboarding.css';
import './styles/settings.css';
import './styles/components.css';

// ── Modules ───────────────────────────────────────────────
import { initTelegram, getTgUser } from './lib/telegram.js';
import { sbRpc, sb } from './lib/supabase.js';
import { haptic } from './lib/haptic.js';
import { AUTO_REFRESH_MS } from './config.js';
import { getState, setState } from './state.js';
import { initNavigation } from './navigation.js';
import { renderToday, loadTodayTasks } from './pages/today.js';
import { renderProfile } from './pages/profile.js';
import { renderLeaderboard, loadLeaderboard } from './pages/leaderboard.js';
import { renderBadges } from './pages/badges.js';
import { showOnboarding } from './pages/onboarding.js';

// ════════════════════════════════════════════════════════════
// DATA LOADERS
// ════════════════════════════════════════════════════════════
async function loadMe() {
  try {
    const user = getTgUser();
    if (!user?.id) return null;
    const r = await sbRpc('get_user_stats', { p_telegram_id: user.id });
    const d = await r.json();
    if (d && d[0]) return d[0];
    // If array response (some RPCs return array)
    if (d && !Array.isArray(d) && d.total_xp !== undefined) return d;
    return null;
  } catch { return null; }
}

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════
async function init() {
  // 1. Init Telegram SDK
  initTelegram();

  // 2. Init navigation
  initNavigation();

  // 3. Load data in parallel
  const [me, lb, todayTasks] = await Promise.all([
    loadMe(),
    loadLeaderboard(),
    loadTodayTasks(),
  ]);

  setState({ me, lb, todayTasks, loaded: true });

  // 4. Check onboarding
  const needsOnboarding = me && !me.onboarding_done;
  if (needsOnboarding) {
    showOnboarding(async () => {
      // After onboarding, reload everything
      const freshMe = await loadMe();
      const freshTasks = await loadTodayTasks();
      setState({ me: freshMe, todayTasks: freshTasks, onboardingDone: true });
      renderToday(freshTasks);
      renderProfile(freshMe);
      renderLeaderboard(lb, freshMe);
      renderBadges(freshMe);
    });
    // Don't render pages behind the overlay
    return;
  }

  // 5. Render initial pages
  renderToday(todayTasks);
  if (me) renderProfile(me);
  renderLeaderboard(lb, me);
  if (me) renderBadges(me);

  haptic.success();
}

// ════════════════════════════════════════════════════════════
// AUTO-REFRESH
// ════════════════════════════════════════════════════════════
setInterval(async () => {
  const [me, lb, todayTasks] = await Promise.all([
    loadMe(),
    loadLeaderboard(),
    loadTodayTasks(),
  ]);
  setState({ me, lb, todayTasks });

  const state = getState();
  // Only refresh the visible tab
  if (state.currentTab === 'today') renderToday(todayTasks);
  if (state.currentTab === 'profile' && me) renderProfile(me);
  if (state.currentTab === 'lb') renderLeaderboard(lb, me);
  if (state.currentTab === 'badges' && me) renderBadges(me);
}, AUTO_REFRESH_MS);

// ════════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════════
init();
