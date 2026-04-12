// ════════════════════════════════════════════════════════════
// LEADERBOARD PAGE — Premium Ranked List
// ════════════════════════════════════════════════════════════
import { haptic } from '../lib/haptic.js';
import { sb } from '../lib/supabase.js';
import { getTgUser, tg } from '../lib/telegram.js';
import { fmt, getLvl } from '../lib/utils.js';
import { rankBadgeSVG, crownSVG, badgeColor } from '../components/svg.js';

const BOT_USERNAME = 'yaphabitbot';
const MINIAPP_URL = 'https://yaprank.netlify.app';

export async function loadLeaderboard() {
  try {
    const r = await sb('/rest/v1/leaderboard?select=*&order=rank.asc&limit=50');
    return await r.json();
  } catch { return []; }
}

export function renderLeaderboard(lb, me) {
  const container = document.getElementById('lb-content');
  if (!container) return;

  // ── Hero header — user's rank highlight ──
  const lvl = me ? getLvl(me.total_xp || 0) : null;
  const headerHTML = me ? `
    <div class="header-compact">
      <div class="hc-avatar">${rankBadgeSVG(me.level || 1, 40)}</div>
      <div class="hc-info">
        <div class="hc-name">${me.first_name || 'Anonim'}</div>
        <div class="hc-rank">${lvl?.t || ''} · #${me.rank || '—'}</div>
      </div>
      <div class="lb-header-actions">
        <button class="lb-header-btn" id="lb-share-btn" aria-label="Paylaş">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </button>
        <button class="lb-header-btn" id="lb-refresh-btn" aria-label="Yenile">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
        </button>
      </div>
    </div>
  ` : '';

  // ── List ──
  let listHTML = '';
  if (!lb || !lb.length) {
    listHTML = `
      <div class="center-msg">
        <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" width="48" height="48">
          <path d="M8 21h8M12 21v-4M4 4h4v7a4 4 0 008 0V4h4M4 4H2M20 4h2"/>
        </svg>
        <p>Henüz sıralama yok</p>
      </div>`;
  } else {
    const myId = me?.user_id || me?.telegram_id;
    const tgId = getTgUser()?.id;

    listHTML = '<div class="lb-list">' + lb.map((p, i) => {
      const isMe = me && (p.user_id === myId || p.telegram_id == tgId);
      const top3 = p.rank <= 3;
      const pLvl = getLvl(p.total_xp || 0);

      // Rank number with medals for top 3
      const medalMap = { 1: '🥇', 2: '🥈', 3: '🥉' };
      const rankEl = isMe
        ? `<div class="lb-rank-num me-num">${p.rank}</div>`
        : top3
        ? `<div class="lb-rank-num r${p.rank}">${medalMap[p.rank]}</div>`
        : `<div class="lb-rank-num">${p.rank}</div>`;

      const crownHtml = p.rank === 1 ? `<div class="lb-avatar-crown">${crownSVG(14)}</div>` : '';

      // Level title pill instead of follow button
      const levelPill = `<div class="lb-lvl-pill">${pLvl.t}</div>`;

      const actionEl = isMe
        ? `<div class="lb-action"><button class="lb-invite-btn" id="lb-invite-me">Davet Et</button></div>`
        : `<div class="lb-action">${levelPill}</div>`;

      return `
      <div class="lb-item ${isMe ? 'me' : ''}" style="animation-delay:${i * .03}s" data-rank="${p.rank}" data-name="${p.first_name || ''}">
        ${rankEl}
        <div class="lb-avatar">
          ${rankBadgeSVG(p.level || 1, 38)}
          ${crownHtml}
        </div>
        <div class="lb-info">
          <div class="lb-name ${isMe ? 'me-name' : ''}">${p.first_name || 'Anonim'}${p.rank === 1 ? ` ${crownSVG(12)}` : ''}</div>
          <div class="lb-score">
            <svg viewBox="0 0 24 24" fill="var(--green)" width="11" height="11"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span class="lb-score-xp">${fmt(p.total_xp)}</span>
            &nbsp;·&nbsp;
            <svg viewBox="0 0 24 24" fill="#f97316" width="11" height="11"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12a1.44 1.44 0 01-.14-.17C6.97 12.1 6.7 9.71 7.47 7.75 5.55 9.44 4.5 11.96 4.5 14.5c0 4.15 3.35 7.5 7.5 7.5s7.5-3.35 7.5-7.5c0-1.35-.37-2.71-1.12-3.85L17.66 11.2z"/></svg>
            ${p.current_streak || 0}g
          </div>
        </div>
        ${actionEl}
      </div>`;
    }).join('') + '</div>';
  }

  container.innerHTML = headerHTML + listHTML;

  // ── Bind events ──

  // Share ranking button (header)
  document.getElementById('lb-share-btn')?.addEventListener('click', () => {
    haptic.tap();
    shareRanking(me);
  });

  // Refresh button
  document.getElementById('lb-refresh-btn')?.addEventListener('click', () => {
    haptic.medium();
    const btn = document.getElementById('lb-refresh-btn');
    if (btn) { btn.style.transform = 'rotate(360deg)'; setTimeout(() => { btn.style.transform = ''; }, 600); }
  });

  // "Davet Et" — my row invite button
  document.getElementById('lb-invite-me')?.addEventListener('click', (e) => {
    e.stopPropagation();
    haptic.tap();
    shareBot();
  });

  // Item tap — show popup
  container.querySelectorAll('.lb-item').forEach(item => {
    item.addEventListener('click', () => {
      haptic.select();
      const rank = item.dataset.rank;
      const name = item.dataset.name;
      if (name) {
        tg?.showPopup?.({
          title: `#${rank} — ${name}`,
          message: 'Bu oyuncu hakkında detay bilgi yakında gelecek!',
          buttons: [{ type: 'close' }],
        });
      }
    });
  });
}

// ── Share ranking via Telegram share URL ──
export function shareRanking(me) {
  if (!me) return;

  const lvl = getLvl(me.total_xp || 0);
  const text = [
    `🏆 YAP! Sıralama Kartım`,
    ``,
    `👤 ${me.first_name || 'Anonim'}`,
    `📊 Sıralama: #${me.rank || '—'}`,
    `⭐ Seviye: ${me.level || 1} — ${lvl.t}`,
    `💎 XP: ${fmt(me.total_xp || 0)}`,
    `🔥 Seri: ${me.current_streak || 0} gün`,
    ``,
    `Alışkanlık takip uygulamasını dene! 👇`,
  ].join('\n');

  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${BOT_USERNAME}`)}&text=${encodeURIComponent(text)}`;

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
}

// ── Share bot link ──
function shareBot() {
  const text = `🚀 YAP! ile alışkanlık takibi çok eğlenceli! Görevlerini tamamla, XP kazan, rozet topla! Hadi sen de katıl 🔥`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${BOT_USERNAME}`)}&text=${encodeURIComponent(text)}`;

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
}
