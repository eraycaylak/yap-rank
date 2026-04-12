// ════════════════════════════════════════════════════════════
// TELEGRAM SDK WRAPPER
// ════════════════════════════════════════════════════════════

export const tg = window.Telegram?.WebApp;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  if (tg.setHeaderColor) tg.setHeaderColor('#3ECF8E');
  if (tg.setBackgroundColor) tg.setBackgroundColor('#F0F4FF');
  if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();
}

export function getTgUser() {
  return tg?.initDataUnsafe?.user || null;
}
