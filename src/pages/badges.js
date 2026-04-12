// ════════════════════════════════════════════════════════════
// BADGES PAGE — Rozet koleksiyonu
// ════════════════════════════════════════════════════════════
import { haptic } from '../lib/haptic.js';
import { tg } from '../lib/telegram.js';

const BADGE_DEFS = [
  { id: 'first',   name: 'İlk Başlangıç',  img: '/assets/svg/apple.svg',    cond: m => m.completed_tasks >= 1,     desc: 'İlk görevini tamamla' },
  { id: 'run',     name: 'Koşucu',          img: '/assets/svg/running.svg',  cond: m => m.completed_tasks >= 10,    desc: '10 görev tamamla' },
  { id: 'box',     name: 'Savaşçı',         img: '/assets/svg/boxing.svg',   cond: m => (m.current_streak || 0) >= 7, desc: '7 günlük seri' },
  { id: 'lift',    name: 'Demir Adam',      img: '/assets/svg/dumbbell.svg', cond: m => m.completed_tasks >= 50,    desc: '50 görev tamamla' },
  { id: 'coffee',  name: 'Sabahçı',         img: '/assets/svg/coffee.svg',   cond: m => (m.current_streak || 0) >= 3, desc: '3 günlük seri' },
  { id: 'scale',   name: 'Dengelici',       img: '/assets/svg/scale.svg',    cond: m => m.perfect_days >= 5,        desc: '5 mükemmel gün' },
  { id: 'steak',   name: 'Güçlü Karakter',  img: '/assets/svg/steak.svg',    cond: m => m.level >= 8,               desc: 'Seviye 8\'e ulaş' },
  { id: 'egg',     name: 'Sabır Taşı',      img: '/assets/svg/egg.svg',      cond: m => m.level >= 5,               desc: 'Seviye 5\'e ulaş' },
  { id: 'carrot',  name: 'Sağlıklı',        img: '/assets/svg/carrot.svg',   cond: m => m.perfect_days >= 10,       desc: '10 mükemmel gün' },
  { id: 'chicken', name: 'Protein Kral',     img: '/assets/svg/chicken.svg',  cond: m => m.completed_tasks >= 100,   desc: '100 görev tamamla' },
  { id: 'grape',   name: 'Bereket',          img: '/assets/svg/grape.svg',    cond: m => (m.longest_streak || 0) >= 14, desc: '14 günlük seri' },
  { id: 'donut',   name: 'Sindirici',        img: '/assets/svg/donut.svg',    cond: m => m.level >= 15,              desc: 'Seviye 15\'e ulaş' },
];

export function renderBadges(me) {
  const container = document.getElementById('badges-content');
  if (!container) return;

  let gridHTML = '';
  BADGE_DEFS.forEach((b, i) => {
    const earned = me ? b.cond(me) : false;
    gridHTML += `
    <div class="badge-card ${earned ? '' : 'locked'} animate-in" style="animation-delay:${i * .04}s"
         data-badge-name="${b.name}" data-badge-desc="${b.desc}" data-badge-earned="${earned}">
      <img class="badge-img" src="${b.img}" alt="${b.name}" loading="lazy"/>
      <div class="badge-name">${b.name}</div>
      ${earned ? `<div class="badge-earned"><svg viewBox="0 0 24 24" fill="#3ECF8E" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>` : ''}
    </div>`;
  });

  container.innerHTML = `
    <div class="header-strip" style="padding-bottom:1.5rem">
      <div style="position:relative;z-index:1">
        <div class="header-label">BAŞARILAR</div>
        <div class="header-name">Rozetlerin</div>
      </div>
    </div>
    <div class="badges-grid">${gridHTML}</div>
  `;

  // Bind badge tap
  container.querySelectorAll('.badge-card').forEach(card => {
    card.addEventListener('click', () => {
      haptic.select();
      const name = card.dataset.badgeName;
      const desc = card.dataset.badgeDesc;
      const earned = card.dataset.badgeEarned === 'true';
      tg?.showPopup?.({
        title: earned ? `${name}` : `${name}`,
        message: earned ? 'Bu rozeti kazandın! Harika iş çıkardın.' : `Koşul: ${desc}`,
        buttons: [{ type: 'close' }],
      });
    });
  });
}
