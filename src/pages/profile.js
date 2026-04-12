// ════════════════════════════════════════════════════════════
// PROFILE PAGE — Stats + Activity
// ════════════════════════════════════════════════════════════
import { haptic } from '../lib/haptic.js';
import { sbRpc } from '../lib/supabase.js';
import { getTgUser, tg } from '../lib/telegram.js';
import { fmt, getLvl, getNext, lvlPct, animN, fmtDate, fmtTime } from '../lib/utils.js';
import { rankBadgeSVG, crownSVG, starsHTML, ICONS } from '../components/svg.js';

export function renderProfile(me) {
  const container = document.getElementById('profile-content');
  if (!container) return;

  if (!me) {
    container.innerHTML = `
      <div class="center-msg">
        <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" width="48" height="48">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        <p>Profil yüklenemedi</p>
      </div>`;
    return;
  }

  const lvl = getLvl(me.total_xp || 0);
  const pct = lvlPct(me.total_xp || 0);
  const isTop1 = me.rank == 1;
  const name = me.first_name || 'Kullanıcı';

  container.innerHTML = `
    <div class="header-strip">
      <div style="position:relative;z-index:1">
        <div class="header-label">YAP! PROFİL</div>
        <div class="header-name">Merhaba, ${name}!</div>
      </div>
    </div>

    <div class="profile-card animate-in">
      <div class="profile-top">
        <div class="rank-badge-wrap">
          <div id="pf-badge">${rankBadgeSVG(me.level || 1, 56)}</div>
          ${isTop1 ? `<div class="rank-badge-crown">${crownSVG(18)}</div>` : ''}
        </div>
        <div class="pf-info">
          <div class="pf-name">${name}</div>
          <div class="pf-rank">${lvl.t}</div>
          <div class="pf-stars">${starsHTML(me.level || 1)}</div>
        </div>
        <div class="pf-xp-pill">
          ${ICONS.star}
          <span id="pf-xp-num">—</span>
        </div>
      </div>

      <div class="pf-pills">
        <div class="pill pill-fire">
          ${ICONS.fire}
          <span>${me.current_streak || 0} Gün Seri</span>
        </div>
        <div class="pill pill-rank">
          ${ICONS.chart}
          <span>#${me.rank}</span>
        </div>
        <div class="xp-bar-wrap">
          <div class="xp-bar-label">
            <span>Seviye XP</span>
            <span style="color:var(--green)">${pct}%</span>
          </div>
          <div class="xp-track">
            <div class="xp-fill" id="pf-bar" style="width:0%"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">İstatistikler</div>
    <div class="stats-grid">
      <div class="stat-card sc-blue animate-in" style="animation-delay:.05s">
        <div class="sc-label">
          <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.8)" width="12" height="12"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Toplam XP
        </div>
        <div class="sc-num" id="sc-xp">—</div>
        <div class="sc-sub">deneyim puanı</div>
      </div>
      <div class="stat-card sc-red animate-in" style="animation-delay:.1s">
        <div class="sc-label">
          <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.8)" width="12" height="12"><circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="2"/><path d="M9 12l2 2 4-4" stroke="rgba(255,255,255,.8)" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
          Rozet
        </div>
        <div class="sc-num" id="sc-badges">—</div>
        <div class="sc-sub">kazanılan</div>
      </div>
      <div class="stat-card sc-purple animate-in" style="animation-delay:.15s">
        <div class="sc-label">
          <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.8)" width="12" height="12"><path d="M3 13h2v8H3v-8zm4-4h2v12H7V9zm4-6h2v18h-2V3zm4 8h2v10h-2v-10zm4-4h2v14h-2V7z"/></svg>
          Sıralama
        </div>
        <div class="sc-num" id="sc-rank">—</div>
        <div class="sc-sub">lider tablosunda</div>
      </div>
      <div class="stat-card sc-orange animate-in" style="animation-delay:.2s">
        <div class="sc-label">
          <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.8)" width="12" height="12"><path d="M9 16.17L5.53 12.7a1 1 0 00-1.41 1.41l4.18 4.18a1 1 0 001.41 0L20.29 7.71A1 1 0 0018.88 6.3L9 16.17z"/></svg>
          Görevler
        </div>
        <div class="sc-num" id="sc-tasks">—</div>
        <div class="sc-sub">tamamlanan</div>
      </div>
    </div>

    <div class="section-title">Son Aktiviteler</div>
    <div class="activity-list" id="act-list">
      <div class="center-msg"><div class="spinner"></div><p>Yükleniyor...</p></div>
    </div>
    <div style="height:1.25rem"></div>
  `;

  // Animate numbers
  setTimeout(() => {
    animN(document.getElementById('pf-xp-num'), me.total_xp, 100);
    animN(document.getElementById('sc-xp'), me.total_xp, 200);
    animN(document.getElementById('sc-badges'), Math.max(1, Math.floor((me.level || 1) / 2)), 300);
    animN(document.getElementById('sc-rank'), me.rank, 400);
    animN(document.getElementById('sc-tasks'), me.completed_tasks, 500);
  }, 0);

  // XP bar animation
  setTimeout(() => {
    const bar = document.getElementById('pf-bar');
    if (bar) bar.style.width = pct + '%';
  }, 600);

  // Load activity
  loadAndRenderActivity();
}

async function loadAndRenderActivity() {
  const user = getTgUser();
  if (!user) return;

  try {
    const r = await sbRpc('get_user_activity', { p_telegram_id: user.id });
    const acts = await r.json();
    renderActivity(Array.isArray(acts) ? acts : []);
  } catch {
    renderActivity([]);
  }
}

function renderActivity(acts) {
  const list = document.getElementById('act-list');
  if (!list) return;

  if (!acts.length) {
    list.innerHTML = `
      <div class="center-msg">
        <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" width="48" height="48">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <p>Henüz aktivite yok.<br/>Görevleri tamamladıkça burada görünecek.</p>
      </div>`;
    return;
  }

  const STATUS_LABEL = { completed: 'Tamamlandı', missed: 'Kaçırıldı', pending: 'Bekliyor', skipped: 'Atlandı' };
  const STATUS_CLS = { completed: 's-completed', missed: 's-missed', pending: 's-pending', skipped: 's-skipped' };
  const ICON_CLS = { completed: 'completed', missed: 'missed', pending: 'pending', skipped: 'skipped' };
  const ACT_ICONS = {
    completed: `<path d="M9 12l2 2 4-4" stroke="#22c55e" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="12" cy="12" r="9" stroke="#22c55e" stroke-width="2" fill="none"/>`,
    missed: `<circle cx="12" cy="12" r="9" stroke="#ef4444" stroke-width="2" fill="none"/><path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round" fill="none"/>`,
    pending: `<circle cx="12" cy="12" r="9" stroke="#f59e0b" stroke-width="2" fill="none"/><path d="M12 7v5l3 3" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" fill="none"/>`,
    skipped: `<circle cx="12" cy="12" r="9" stroke="#94a3b8" stroke-width="2" fill="none"/><path d="M9 12h6M15 12l-3-3m3 3l-3 3" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  };

  let html = '';
  acts.forEach((a, i) => {
    const st = a.status || 'pending';
    const dateStr = fmtDate(a.scheduled_date || a.scheduled_time);
    const timeStr = fmtTime(a.scheduled_time);
    html += `
    <div class="activity-item animate-in" style="animation-delay:${i * .03}s">
      <div class="act-icon ${ICON_CLS[st] || ''}">
        <svg viewBox="0 0 24 24" width="20" height="20">${ACT_ICONS[st] || ACT_ICONS.pending}</svg>
      </div>
      <div class="act-info">
        <div class="act-title">${a.task_title || 'Görev'}</div>
        <div class="act-time">${dateStr}${timeStr ? ' · ' + timeStr : ''}</div>
      </div>
      <span class="act-status ${STATUS_CLS[st] || ''}">${STATUS_LABEL[st] || st}</span>
    </div>`;
  });

  list.innerHTML = html;
}
