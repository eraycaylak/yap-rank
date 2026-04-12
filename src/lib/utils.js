// ════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════
import { LEVELS } from '../config.js';

/** Format number Turkish locale */
export function fmt(n) {
  return Number(n || 0).toLocaleString('tr');
}

/** Get level info for given XP */
export function getLvl(xp) {
  let c = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.xp) c = l; else break; }
  return c;
}

/** Get next level info */
export function getNext(xp) {
  return LEVELS.find(l => l.xp > xp) || null;
}

/** Calculate XP progress percentage for current level */
export function lvlPct(xp) {
  const c = getLvl(xp), n = getNext(xp);
  if (!n) return 100;
  return Math.round(((xp - c.xp) / (n.xp - c.xp)) * 100);
}

/** Star count based on level (max 5) */
export function starCount(level) {
  return Math.min(5, Math.ceil(level / 4));
}

/** Animate a number counting up */
export function animN(el, to, delay = 0) {
  if (!el) return;
  const target = parseInt(to) || 0;
  let n = 0;
  setTimeout(() => {
    if (target === 0) { el.textContent = '0'; return; }
    const step = Math.max(1, Math.round(target / 50));
    const t = setInterval(() => {
      n = Math.min(n + step, target);
      el.textContent = fmt(n);
      if (n >= target) clearInterval(t);
    }, 16);
  }, delay);
}

/** Format time string (HH:MM) from date or time string */
export function fmtTime(dateOrTime) {
  if (!dateOrTime) return '';
  const d = new Date(dateOrTime);
  if (isNaN(d.getTime())) {
    // It's a time-only string like "08:00:00"
    return dateOrTime.substring(0, 5);
  }
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/** Format date (Bugün, Dün, or date) */
export function fmtDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Bugün';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

/** Check if task is available for completion (30-min rule) */
export function isTaskAvailable(scheduledTime) {
  if (!scheduledTime) return true;
  const now = new Date();
  const taskTime = new Date(scheduledTime);
  if (isNaN(taskTime.getTime())) return true;
  const thirtyMinBefore = new Date(taskTime.getTime() - 30 * 60 * 1000);
  return now >= thirtyMinBefore;
}

/** Minutes until task is available */
export function minutesUntilAvailable(scheduledTime) {
  if (!scheduledTime) return 0;
  const now = new Date();
  const taskTime = new Date(scheduledTime);
  if (isNaN(taskTime.getTime())) return 0;
  const thirtyMinBefore = new Date(taskTime.getTime() - 30 * 60 * 1000);
  const diff = thirtyMinBefore - now;
  return Math.max(0, Math.ceil(diff / 60_000));
}

/** Get today's date formatted for display */
export function todayFormatted() {
  const now = new Date();
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${now.getDate()} ${months[now.getMonth()]}, ${days[now.getDay()]}`;
}
