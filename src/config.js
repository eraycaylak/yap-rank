// ════════════════════════════════════════════════════════════
// CONFIG — Supabase credentials & app constants
// ════════════════════════════════════════════════════════════

export const SB_URL = 'https://txkhnectxqpjhfipdydq.supabase.co';
export const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4a2huZWN0eHFwamhmaXBkeWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTUyOTUsImV4cCI6MjA5MTUzMTI5NX0.d_4W8md2BzpB9ysnpmWUZyT2vkoWXuPft0xeP1Lrl8I';

export const LEVELS = [
  { l: 1,  xp: 0,     t: 'Yeni Başlayan' },
  { l: 2,  xp: 100,   t: 'Toparlanan' },
  { l: 3,  xp: 250,   t: 'Takipte' },
  { l: 4,  xp: 450,   t: 'Çabalayan' },
  { l: 5,  xp: 700,   t: 'Düzenli' },
  { l: 6,  xp: 1000,  t: 'Sağlamcı' },
  { l: 7,  xp: 1350,  t: 'İnatçı' },
  { l: 8,  xp: 1750,  t: 'Odakçı' },
  { l: 9,  xp: 2200,  t: 'Disiplinci' },
  { l: 10, xp: 2700,  t: 'YAP! Çırağı' },
  { l: 11, xp: 3300,  t: 'Seri Kuran' },
  { l: 12, xp: 4000,  t: 'İradeci' },
  { l: 13, xp: 4800,  t: 'Güçlü Rutinci' },
  { l: 14, xp: 5700,  t: 'Düzen Ustası' },
  { l: 15, xp: 6700,  t: 'YAP! Ustası' },
  { l: 16, xp: 7800,  t: 'İcra Makinesi' },
  { l: 17, xp: 9000,  t: 'Çelik Rutin' },
  { l: 18, xp: 10300, t: 'Sistem Adamı' },
  { l: 19, xp: 11700, t: 'Bitirici' },
  { l: 20, xp: 13200, t: 'YAP! Komutanı' },
];

export const PRIORITY_LABELS = ['', 'Kolay', 'Orta', 'Zor', 'Çok Zor'];
export const RECURRENCE_LABELS = { daily: 'Günlük', weekly: 'Haftalık', once: 'Tek seferlik', custom: 'Özel' };
export const TONE_LABELS = { soft: 'Yumuşak', balanced: 'Dengeli', hard: 'Sert', coach: 'Koç' };

export const AUTO_REFRESH_MS = 90_000;
