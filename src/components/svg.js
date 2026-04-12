// ════════════════════════════════════════════════════════════
// SVG GENERATORS — Badge, Crown, Stars
// ════════════════════════════════════════════════════════════

export function badgeColor(level) {
  if (level >= 16) return { fill1: '#6366f1', fill2: '#4338ca', ring: '#818cf8' }; // platinum
  if (level >= 11) return { fill1: '#F9B43A', fill2: '#E09010', ring: '#FCD34D' }; // gold
  if (level >= 6)  return { fill1: '#94A3B8', fill2: '#64748B', ring: '#CBD5E1' }; // silver
  return { fill1: '#CD7C2F', fill2: '#9A5A1E', ring: '#F0A060' };                  // bronze
}

export function rankBadgeSVG(level, size = 56) {
  const c = badgeColor(level);
  const id = `bg${Math.random().toString(36).slice(2, 6)}`;
  return `<svg class="badge-svg" width="${size}" height="${size}" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="s${id}" x1="10" y1="5" x2="90" y2="105" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${c.fill1}"/>
      <stop offset="1" stop-color="${c.fill2}"/>
    </linearGradient>
  </defs>
  <path d="M50 4 L92 20 L92 58 C92 80 72 96 50 104 C28 96 8 80 8 58 L8 20 Z"
    fill="url(#s${id})" stroke="${c.ring}" stroke-width="3.5"/>
  <path d="M50 12 L84 25 L84 57 C84 75 67 89 50 97"
    stroke="rgba(255,255,255,0.2)" stroke-width="2" fill="none"/>
  <path d="M33 38 L50 55 L67 38" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M33 52 L50 69 L67 52" stroke="rgba(255,255,255,0.45)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

export function crownSVG(size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#F9B43A">
    <path d="M2 19h20v2H2v-2zm1-1l3-11 6 7 6-9 3 13H3z"/>
  </svg>`;
}

export function starSVG(filled) {
  return filled
    ? `<svg viewBox="0 0 24 24" width="13" height="13" fill="#F9B43A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
    : `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#CBD5E1" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
}

export function starsHTML(level) {
  const n = Math.min(5, Math.ceil(level / 4));
  let h = '';
  for (let i = 0; i < 5; i++) h += starSVG(i < n);
  return h;
}

/** Inline SVG icons used throughout the app */
export const ICONS = {
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
  skip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>`,
  fire: `<svg viewBox="0 0 24 24"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12a1.44 1.44 0 01-.14-.17C6.97 12.1 6.7 9.71 7.47 7.75 5.55 9.44 4.5 11.96 4.5 14.5c0 4.15 3.35 7.5 7.5 7.5s7.5-3.35 7.5-7.5c0-1.35-.37-2.71-1.12-3.85L17.66 11.2z" fill="currentColor"/></svg>`,
  star: `<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>`,
  chart: `<svg viewBox="0 0 24 24"><path d="M3 13h2v8H3v-8zm4-4h2v12H7V9zm4-6h2v18h-2V3zm4 8h2v10h-2v-10zm4-4h2v14h-2V7z" fill="currentColor"/></svg>`,
  checkCircle: `<svg viewBox="0 0 24 24" fill="#3ECF8E"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
  brain: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a9 9 0 00-9 9c0 3.1 1.6 5.8 4 7.4V21h2v-2.1c.9.3 1.9.5 3 .5s2.1-.2 3-.5V21h2v-2.6c2.4-1.6 4-4.3 4-7.4a9 9 0 00-9-9zm-1 14.9V14h2v2.9c-.3.1-.6.1-1 .1s-.7 0-1-.1zM8 14v-2h2v2H8zm6 0v-2h2v2h-2z"/></svg>`,
};
