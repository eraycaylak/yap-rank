// ════════════════════════════════════════════════════════════
// TELEGRAM SDK WRAPPER
// ════════════════════════════════════════════════════════════

export const tg = window.Telegram?.WebApp;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();

  // ── Dark mode detection ──
  const isDark = tg.colorScheme === 'dark';
  if (isDark) {
    document.documentElement.classList.add('tg-dark');
    if (tg.setHeaderColor) tg.setHeaderColor('#0F172A');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#0F172A');
  } else {
    if (tg.setHeaderColor) tg.setHeaderColor('#1E9960');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#F0F4FF');
  }

  if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();

  // ── Apply safe area CSS variables ──
  applySafeAreas();

  // ── Prompt "Add to Home Screen" (once per user) ──
  promptHomeScreen();
}

function promptHomeScreen() {
  if (!tg?.addToHomeScreen) return;

  // Only prompt once — use localStorage to track
  const key = 'yap_homescreen_prompted';
  if (localStorage.getItem(key)) return;

  // Small delay so app loads first
  setTimeout(() => {
    tg.addToHomeScreen();
    localStorage.setItem(key, '1');
  }, 2000);
}

function applySafeAreas() {
  const root = document.documentElement;

  // Safe area insets (phone notch etc.)
  const sa = tg?.safeAreaInset;
  if (sa) {
    root.style.setProperty('--safe-top', sa.top + 'px');
    root.style.setProperty('--safe-bottom', sa.bottom + 'px');
  }

  // Content safe area (Telegram header area)
  const csa = tg?.contentSafeAreaInset;
  if (csa) {
    root.style.setProperty('--content-safe-top', csa.top + 'px');
  }

  // Combined: total top offset
  const totalTop = (sa?.top || 0) + (csa?.top || 0);
  root.style.setProperty('--header-offset', totalTop + 'px');

  // Listen for viewport changes
  if (tg?.onEvent) {
    tg.onEvent('viewportChanged', () => {
      const sa2 = tg?.safeAreaInset;
      const csa2 = tg?.contentSafeAreaInset;
      const total = (sa2?.top || 0) + (csa2?.top || 0);
      root.style.setProperty('--safe-top', (sa2?.top || 0) + 'px');
      root.style.setProperty('--content-safe-top', (csa2?.top || 0) + 'px');
      root.style.setProperty('--header-offset', total + 'px');
    });

    tg.onEvent('safeAreaChanged', () => {
      const sa2 = tg?.safeAreaInset;
      root.style.setProperty('--safe-top', (sa2?.top || 0) + 'px');
      const total = (sa2?.top || 0) + (tg?.contentSafeAreaInset?.top || 0);
      root.style.setProperty('--header-offset', total + 'px');
    });

    tg.onEvent('contentSafeAreaChanged', () => {
      const csa2 = tg?.contentSafeAreaInset;
      root.style.setProperty('--content-safe-top', (csa2?.top || 0) + 'px');
      const total = (tg?.safeAreaInset?.top || 0) + (csa2?.top || 0);
      root.style.setProperty('--header-offset', total + 'px');
    });
  }
}

export function getTgUser() {
  return tg?.initDataUnsafe?.user || null;
}

/** Get user's Telegram profile photo URL */
export function getTgPhoto() {
  const user = tg?.initDataUnsafe?.user;
  if (user?.photo_url) return user.photo_url;
  return null;
}
