// ════════════════════════════════════════════════════════════
// TODAY PAGE — Premium Task Dashboard with Hero Section
// ════════════════════════════════════════════════════════════
import { haptic } from '../lib/haptic.js';
import { sbRpc } from '../lib/supabase.js';
import { getTgUser, getTgPhoto, tg } from '../lib/telegram.js';
import { fmtTime, isTaskAvailable, minutesUntilAvailable, todayFormatted, getLvl, lvlPct } from '../lib/utils.js';
import { ICONS, rankBadgeSVG, starsHTML } from '../components/svg.js';
import { PRIORITY_LABELS, RECURRENCE_LABELS } from '../config.js';
import { showToast } from '../components/toast.js';
import { launchConfetti } from '../components/confetti.js';
import { getState, setState } from '../state.js';
import { showAddTaskModal } from './add-task-modal.js';

export async function loadTodayTasks() {
  const user = getTgUser();
  if (!user) return [];
  try {
    const r = await sbRpc('miniapp_get_today', { p_telegram_id: user.id });
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export function renderToday(tasks) {
  const container = document.getElementById('today-content');
  if (!container) return;

  const me = getState().me;
  const user = getTgUser();
  const photo = getTgPhoto();
  const name = user?.first_name || me?.first_name || 'Kullanıcı';
  const lvl = getLvl(me?.total_xp || 0);
  const pct = lvlPct(me?.total_xp || 0);

  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && completed === total;

  let listHTML = '';

  if (tasks.length === 0) {
    listHTML = `
      <div class="task-list-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--tg-hint)" stroke-width="1.5" width="56" height="56">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
        </svg>
        <p>Bugün görev yok.<br/>Hemen bir görev ekle!</p>
      </div>
    `;
  } else if (allDone) {
    listHTML = `
      <div class="today-all-done">
        <div class="today-all-done-icon">
          <svg viewBox="0 0 48 48" width="80" height="80">
            <circle cx="24" cy="24" r="22" fill="none" stroke="var(--green)" stroke-width="3" opacity=".2"/>
            <circle cx="24" cy="24" r="22" fill="none" stroke="var(--green)" stroke-width="3" 
                    stroke-dasharray="138" stroke-dashoffset="0" stroke-linecap="round"
                    style="animation: circle-fill 1s ease-out both"/>
            <path d="M15 24l6 6 12-12" fill="none" stroke="var(--green)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                  style="animation: check-draw .5s .5s ease both; stroke-dasharray: 30; stroke-dashoffset: 30"/>
          </svg>
        </div>
        <div class="today-all-done-title">Bugün her şeyi bitirdin!</div>
        <div class="today-all-done-sub">Harika iş çıkardın, dinlenmeyi hak ettin 🎉</div>
      </div>
    `;
  } else {
    listHTML = '<div class="task-list">' + tasks.map((t, i) => renderTaskItem(t, i)).join('') + '</div>';
  }

  // Build photo HTML
  const photoHTML = photo
    ? `<img src="${photo}" class="hero-avatar" alt="${name}"/>`
    : `<div class="hero-avatar hero-avatar-fallback">${name.charAt(0).toUpperCase()}</div>`;

  container.innerHTML = `
    <div class="today-hero">
      <div class="today-hero-content">
        <div class="hero-top">
          ${photoHTML}
          <div class="hero-info">
            <div class="hero-greeting">${getGreeting()},</div>
            <div class="hero-name">${name}</div>
          </div>
          <div class="hero-level-badge">
            ${rankBadgeSVG(me?.level || 1, 44)}
            <span class="hero-level-num">Lv.${me?.level || 1}</span>
          </div>
        </div>

        <div class="hero-stats-row">
          <div class="hero-stat">
            ${ICONS.fire}
            <span class="hero-stat-val">${me?.current_streak || 0}</span>
            <span class="hero-stat-label">gün seri</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            ${ICONS.star}
            <span class="hero-stat-val">${me?.total_xp || 0}</span>
            <span class="hero-stat-label">XP</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            ${ICONS.chart}
            <span class="hero-stat-val">#${me?.rank || '–'}</span>
            <span class="hero-stat-label">sıralama</span>
          </div>
        </div>

        <div class="hero-progress">
          <div class="hero-progress-info">
            <span>${todayFormatted()}</span>
            <span class="hero-progress-pct">${completed}/${total} · %${progressPct}</span>
          </div>
          <div class="today-progress-track">
            <div class="today-progress-fill" style="width:${progressPct}%"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">Bugünkü Görevler</div>
    ${listHTML}
  `;

  // FAB button
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.id = 'fab-add-task';
  fab.innerHTML = ICONS.plus;
  fab.addEventListener('click', () => {
    haptic.tap();
    showAddTaskModal(() => refreshToday());
  });

  // Remove old FAB if exists
  document.getElementById('fab-add-task')?.remove();
  document.getElementById('app').appendChild(fab);

  // Bind task events
  bindTaskEvents();
}

function renderTaskItem(task, idx) {
  const time = fmtTime(task.scheduled_time);
  const isDone = task.status === 'completed';
  const isSkipped = task.status === 'skipped';
  const isMissed = task.status === 'missed';
  const p = task.priority || 2;
  const available = !isDone && !isSkipped && !isMissed && isTaskAvailable(task.scheduled_time);
  const minsLeft = minutesUntilAvailable(task.scheduled_time);

  let btnHTML = '';
  if (isDone) {
    btnHTML = `<div class="task-complete-btn done">${ICONS.check}</div>`;
  } else if (isSkipped || isMissed) {
    btnHTML = `<div class="task-lock-hint">${isSkipped ? 'Atlandı' : 'Kaçırıldı'}</div>`;
  } else if (available) {
    btnHTML = `<button class="task-complete-btn available" data-action="complete" data-occ="${task.occurrence_id}">${ICONS.check}</button>`;
  } else {
    btnHTML = `<div class="task-lock-hint">${minsLeft} dk</div>`;
  }

  const recLabel = RECURRENCE_LABELS[task.recurrence_type] || '';

  return `
    <div class="task-item p${p}-border ${isDone ? 'completed' : ''} ${isSkipped ? 'skipped' : ''} animate-in" 
         style="animation-delay:${idx * .04}s"
         data-task-id="${task.task_id}" data-occ-id="${task.occurrence_id}">
      <div class="task-time">${time}</div>
      <div class="task-info">
        <div class="task-title">${task.title || 'Görev'}</div>
        <div class="task-meta">
          <span class="task-priority p${p}">${PRIORITY_LABELS[p]}</span>
          ${recLabel ? `<span class="task-recurrence">${recLabel}</span>` : ''}
        </div>
      </div>
      ${btnHTML}
    </div>
  `;
}

function bindTaskEvents() {
  // Complete buttons
  document.querySelectorAll('[data-action="complete"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await completeTask(btn.dataset.occ);
    });
  });

  // Task item tap → detail popup (with skip/delete options)
  document.querySelectorAll('.task-item').forEach(item => {
    // Long-press for skip
    let pressTimer = null;
    item.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => {
        haptic.medium();
        showTaskOptions(item.dataset.occId, item.dataset.taskId);
      }, 500);
    });
    item.addEventListener('touchend', () => clearTimeout(pressTimer));
    item.addEventListener('touchmove', () => clearTimeout(pressTimer));

    // Click for detail
    item.addEventListener('click', () => {
      haptic.select();
      showTaskOptions(item.dataset.occId, item.dataset.taskId);
    });
  });
}

// ── Fun messages for early completion attempts ──
const EARLY_MESSAGES = [
  'Sakin ol şampiyon! ⏰ Henüz vakti gelmedi',
  'Hızlı davranıyorsun ama kurallar kurallar! 😄',
  'Sabırlı ol, vaktinde yapınca 2 kat tatmin 💪',
  'Görev saatine kadar bekle, sonra patlatırsın! 🔥',
  'Erken kalkan yol alır ama bu görev henüz hazır değil 😅',
  'Biraz daha sabret, neredeyse zamanı gelecek ⏳',
  'Acelenin bu sefer XP getirmez, saatinde gel! 🎯',
  'Henüz 30dk kuralı aktif, biraz sonra dene 🚀',
];

function getEarlyMessage() {
  return EARLY_MESSAGES[Math.floor(Math.random() * EARLY_MESSAGES.length)];
}

async function completeTask(occId) {
  const user = getTgUser();
  if (!user || !occId) return;

  haptic.heavy();

  try {
    const r = await sbRpc('miniapp_complete_task', {
      p_telegram_id: user.id,
      p_occurrence_id: occId,
    });
    const data = await r.json();

    if (data?.error === 'TASK_NOT_YET_DUE') {
      haptic.error();
      showToast(getEarlyMessage(), 'warn', 3000);

      // Shake animation on the button
      const btn = document.querySelector(`[data-occ="${occId}"]`);
      if (btn) {
        btn.style.animation = 'shake .4s';
        setTimeout(() => btn.style.animation = '', 400);
      }
      return;
    }
    if (data?.error) {
      haptic.error();
      showToast('Bir şeyler ters gitti 😬', 'error');
      return;
    }

    haptic.success();
    const xp = data?.xp_earned || data?.[0]?.xp_earned || 0;
    if (xp > 0) showToast(`+${xp} XP kazandın!`, 'xp');

    await refreshToday();

    // Check if all done for confetti
    const state = getState();
    const allDone = state.todayTasks.length > 0 &&
      state.todayTasks.every(t => t.status === 'completed');
    if (allDone) {
      setTimeout(() => launchConfetti(), 300);
    }
  } catch {
    haptic.error();
    showToast('Bağlantı hatası', 'error');
  }
}

function showTaskOptions(occId, taskId) {
  if (!tg?.showPopup) return;

  const tasks = getState().todayTasks;
  const task = tasks.find(t => t.occurrence_id === occId);
  if (!task) return;

  const isDone = task.status === 'completed' || task.status === 'skipped';

  const buttons = [];
  if (!isDone) {
    buttons.push({ id: 'skip', type: 'default', text: 'Görevi Atla' });
  }
  buttons.push({ id: 'delete', type: 'destructive', text: 'Görevi Sil' });
  buttons.push({ id: 'cancel', type: 'cancel' });

  tg.showPopup({
    title: task.title || 'Görev',
    message: `Saat: ${fmtTime(task.scheduled_time)}\nZorluk: ${PRIORITY_LABELS[task.priority || 2]}`,
    buttons,
  }, async (bid) => {
    if (bid === 'skip') await skipTask(occId);
    if (bid === 'delete') await deleteTask(taskId);
  });
}

async function skipTask(occId) {
  const user = getTgUser();
  if (!user || !occId) return;

  haptic.medium();
  try {
    await sbRpc('miniapp_skip_task', {
      p_telegram_id: user.id,
      p_occurrence_id: occId,
    });
    haptic.warn();
    showToast('Görev atlandı', 'success');
    await refreshToday();
  } catch {
    haptic.error();
    showToast('Hata oluştu', 'error');
  }
}

async function deleteTask(taskId) {
  const user = getTgUser();
  if (!user || !taskId) return;

  haptic.heavy();
  try {
    await sbRpc('miniapp_delete_task', {
      p_telegram_id: user.id,
      p_task_id: taskId,
    });
    haptic.success();
    showToast('Görev silindi', 'success');
    await refreshToday();
  } catch {
    haptic.error();
    showToast('Hata oluştu', 'error');
  }
}

export async function refreshToday() {
  const tasks = await loadTodayTasks();
  setState({ todayTasks: tasks });
  renderToday(tasks);
}

/** Show/hide FAB based on current tab */
export function setFabVisible(visible) {
  const fab = document.getElementById('fab-add-task');
  if (fab) fab.style.display = visible ? '' : 'none';
}
