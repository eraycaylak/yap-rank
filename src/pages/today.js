// ════════════════════════════════════════════════════════════
// TODAY PAGE — Task list with complete/skip
// ════════════════════════════════════════════════════════════
import { haptic } from '../lib/haptic.js';
import { sbRpc } from '../lib/supabase.js';
import { getTgUser, tg } from '../lib/telegram.js';
import { fmtTime, isTaskAvailable, minutesUntilAvailable, todayFormatted } from '../lib/utils.js';
import { ICONS } from '../components/svg.js';
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

export function renderToday(tasks) {
  const container = document.getElementById('today-content');
  if (!container) return;

  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && completed === total;

  let listHTML = '';

  if (tasks.length === 0) {
    listHTML = `
      <div class="task-list-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--tg-hint)" stroke-width="1.5" width="48" height="48">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        <p>Bugün görev yok.<br/>Hemen bir görev ekle!</p>
      </div>
    `;
  } else if (allDone) {
    listHTML = `
      <div class="today-all-done animate-pop">
        <div style="font-size:3rem;margin-bottom:.5rem">
          <svg viewBox="0 0 24 24" fill="var(--green)" width="64" height="64"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </div>
        <div class="today-all-done-title">Bugün her şeyi bitirdin!</div>
        <div class="today-all-done-sub">Harika iş çıkardın, dinlenmeyi hak ettin</div>
      </div>
    `;
  } else {
    listHTML = '<div class="task-list">' + tasks.map((t, i) => renderTaskItem(t, i)).join('') + '</div>';
  }

  container.innerHTML = `
    <div class="today-header">
      <div style="position:relative;z-index:1">
        <div class="today-date">${todayFormatted()}</div>
        <div class="today-title">Bugünkü Görevlerin</div>
        <div class="today-progress-wrap">
          <div class="today-progress-label">
            <span>${completed}/${total} tamamlandı</span>
            <span>${pct}%</span>
          </div>
          <div class="today-progress-track">
            <div class="today-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
    </div>
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
      showToast('Henüz vakti gelmedi', 'error');
      return;
    }
    if (data?.error) {
      haptic.error();
      showToast('Hata oluştu', 'error');
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
