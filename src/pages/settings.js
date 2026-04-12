// ════════════════════════════════════════════════════════════
// SETTINGS PAGE — Preferences + Task Management
// ════════════════════════════════════════════════════════════
import { haptic } from '../lib/haptic.js';
import { sbRpc } from '../lib/supabase.js';
import { getTgUser, tg } from '../lib/telegram.js';
import { TONE_LABELS, PRIORITY_LABELS, RECURRENCE_LABELS } from '../config.js';
import { showToast } from '../components/toast.js';
import { ICONS } from '../components/svg.js';
import { fmtTime } from '../lib/utils.js';

let currentSettings = null;
let allTasks = [];

export async function loadSettings() {
  const user = getTgUser();
  if (!user) return null;
  try {
    const r = await sbRpc('miniapp_get_settings', { p_telegram_id: user.id });
    const data = await r.json();
    return data?.[0] || data || null;
  } catch { return null; }
}

async function loadAllTasks() {
  const user = getTgUser();
  if (!user) return [];
  try {
    const r = await sbRpc('miniapp_get_all_tasks', { p_telegram_id: user.id });
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function renderSettings() {
  const container = document.getElementById('settings-content');
  if (!container) return;

  container.innerHTML = '<div class="center-msg"><div class="spinner"></div><p>Yükleniyor...</p></div>';

  const [settings, tasks] = await Promise.all([loadSettings(), loadAllTasks()]);
  currentSettings = settings;
  allTasks = tasks;

  const tone = settings?.tone || 'balanced';
  const notifOn = settings?.notification_enabled !== false;
  const morningOn = settings?.morning_message_enabled !== false;
  const morningHour = settings?.morning_message_hour ?? 8;
  const summaryHour = settings?.daily_summary_hour ?? 22;

  const toneButtons = Object.entries(TONE_LABELS).map(([key, label]) =>
    `<button class="tone-seg ${tone === key ? 'active' : ''}" data-tone="${key}">${label}</button>`
  ).join('');

  const taskListHTML = tasks.length > 0
    ? tasks.map(t => `
      <div class="task-manage-item" data-task-id="${t.id}">
        <div class="task-manage-info">
          <div class="task-manage-title">${t.title}</div>
          <div class="task-manage-meta">${fmtTime(t.scheduled_time)} · ${PRIORITY_LABELS[t.priority || 2]} · ${RECURRENCE_LABELS[t.recurrence_type] || ''}</div>
        </div>
        <button class="task-manage-delete" data-delete-id="${t.id}" aria-label="Sil">${ICONS.trash}</button>
      </div>
    `).join('')
    : '<p style="color:var(--tg-hint);font-size:.8rem;font-weight:600;padding:.5rem 0">Henüz görev yok</p>';

  container.innerHTML = `
    <div class="header-strip" style="padding-bottom:1.5rem">
      <div style="position:relative;z-index:1">
        <div class="header-label">AYARLAR</div>
        <div class="header-name">Tercihler</div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Bildirim Tonu</div>
      <div class="tone-segments" id="tone-selector">${toneButtons}</div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Bildirimler</div>

      <div class="setting-row">
        <div>
          <div class="setting-label">Bildirimler</div>
          <div class="setting-sub">Görev hatırlatmaları</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="set-notif" ${notifOn ? 'checked' : ''}/>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>

      <div class="setting-row">
        <div>
          <div class="setting-label">Sabah Mesajı</div>
          <div class="setting-sub">Günaydın + görev özeti</div>
        </div>
        <div style="display:flex;align-items:center;gap:.5rem">
          <label class="toggle">
            <input type="checkbox" id="set-morning" ${morningOn ? 'checked' : ''}/>
            <div class="toggle-track"></div>
            <div class="toggle-thumb"></div>
          </label>
          <input type="time" class="time-input" id="set-morning-hour" value="${String(morningHour).padStart(2, '0')}:00"/>
        </div>
      </div>

      <div class="setting-row">
        <div>
          <div class="setting-label">Günlük Özet Saati</div>
          <div class="setting-sub">Gün sonu değerlendirme</div>
        </div>
        <input type="time" class="time-input" id="set-summary-hour" value="${String(summaryHour).padStart(2, '0')}:00"/>
      </div>
    </div>

    <div style="padding:0 1rem">
      <button class="settings-save-btn" id="settings-save-btn">Kaydet</button>
    </div>

    <div class="settings-section" style="margin-top:1rem">
      <div class="settings-section-title">Görevlerim (${tasks.length})</div>
      ${taskListHTML}
    </div>

    <div style="height:1.5rem"></div>
  `;

  bindSettingsEvents();
}

function bindSettingsEvents() {
  // Tone selector
  document.querySelectorAll('#tone-selector .tone-seg').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic.select();
      document.querySelectorAll('#tone-selector .tone-seg').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Toggle haptic
  document.querySelectorAll('.toggle input').forEach(input => {
    input.addEventListener('change', () => haptic.select());
  });

  // Save button
  document.getElementById('settings-save-btn')?.addEventListener('click', saveSettings);

  // Delete task buttons
  document.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.deleteId;
      tg?.showConfirm?.('Bu görevi silmek istediğine emin misin?', async (ok) => {
        if (ok) await deleteTaskFromSettings(taskId);
      });
    });
  });
}

async function saveSettings() {
  const user = getTgUser();
  if (!user) return;

  const tone = document.querySelector('#tone-selector .tone-seg.active')?.dataset.tone || 'balanced';
  const notifOn = document.getElementById('set-notif')?.checked ?? true;
  const morningOn = document.getElementById('set-morning')?.checked ?? true;
  const morningHour = parseInt(document.getElementById('set-morning-hour')?.value?.split(':')[0]) || 8;
  const summaryHour = parseInt(document.getElementById('set-summary-hour')?.value?.split(':')[0]) || 22;

  haptic.heavy();
  const btn = document.getElementById('settings-save-btn');
  btn.textContent = 'Kaydediliyor...';
  btn.disabled = true;

  try {
    await sbRpc('miniapp_update_settings', {
      p_telegram_id: user.id,
      p_tone: tone,
      p_notification_on: notifOn,
      p_morning_on: morningOn,
      p_morning_hour: morningHour,
      p_summary_hour: summaryHour,
    });
    haptic.success();
    showToast('Ayarlar kaydedildi', 'success');
  } catch {
    haptic.error();
    showToast('Kayıt hatası', 'error');
  }

  btn.textContent = 'Kaydet';
  btn.disabled = false;
}

async function deleteTaskFromSettings(taskId) {
  const user = getTgUser();
  if (!user) return;

  haptic.heavy();
  try {
    await sbRpc('miniapp_delete_task', {
      p_telegram_id: user.id,
      p_task_id: taskId,
    });
    haptic.success();
    showToast('Görev silindi', 'success');
    await renderSettings(); // Re-render
  } catch {
    haptic.error();
    showToast('Hata oluştu', 'error');
  }
}
