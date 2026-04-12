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
    `<button class="tone-pill ${tone === key ? 'selected' : ''}" data-tone="${key}">${label}</button>`
  ).join('');

  const taskListHTML = tasks.length > 0
    ? tasks.map((t, i) => `
      <div class="managed-task animate-in" style="animation-delay:${i * .03}s" data-task-id="${t.id}">
        <div class="mt-info">
          <div class="mt-title">${t.title}</div>
          <div class="mt-time">${fmtTime(t.scheduled_time)} · ${PRIORITY_LABELS[t.priority || 2]} · ${RECURRENCE_LABELS[t.recurrence_type] || ''}</div>
        </div>
        <button class="mt-delete" data-delete-id="${t.id}" aria-label="Sil">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
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

    <div class="settings-content">
      <div class="settings-section">
        <div class="settings-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--tg-hint)" stroke-width="2" width="13" height="13"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
          Bildirim Tonu
        </div>
        <div class="tone-row" id="tone-selector">${toneButtons}</div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--tg-hint)" stroke-width="2" width="13" height="13"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          Bildirimler
        </div>

        <div class="setting-row">
          <div>
            <div class="setting-label">Hatırlatmalar</div>
            <div class="setting-hint">Görev hatırlatma mesajları</div>
          </div>
          <div class="toggle ${notifOn ? 'on' : ''}" id="set-notif" data-key="notif">
            <div class="toggle-knob"></div>
          </div>
        </div>

        <div class="setting-row">
          <div>
            <div class="setting-label">Sabah Mesajı</div>
            <div class="setting-hint">Günaydın + görev özeti</div>
          </div>
          <div style="display:flex;align-items:center;gap:.5rem">
            <div class="toggle ${morningOn ? 'on' : ''}" id="set-morning" data-key="morning">
              <div class="toggle-knob"></div>
            </div>
            <select class="setting-select" id="set-morning-hour">
              ${[6,7,8,9,10,11].map(h => `<option value="${h}" ${morningHour === h ? 'selected' : ''}>${String(h).padStart(2,'0')}:00</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="setting-row">
          <div>
            <div class="setting-label">Günlük Özet</div>
            <div class="setting-hint">Gün sonu değerlendirme</div>
          </div>
          <select class="setting-select" id="set-summary-hour">
            ${[20,21,22,23].map(h => `<option value="${h}" ${summaryHour === h ? 'selected' : ''}>${String(h).padStart(2,'0')}:00</option>`).join('')}
          </select>
        </div>
      </div>

      <div style="padding:0 1rem">
        <button class="modal-submit" id="settings-save-btn">Kaydet</button>
      </div>

      <div class="settings-section" style="margin-top:.75rem">
        <div class="settings-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--tg-hint)" stroke-width="2" width="13" height="13"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          Görevlerim (${tasks.length})
        </div>
        ${taskListHTML}
      </div>

      <div style="height:1.5rem"></div>
    </div>
  `;

  bindSettingsEvents();
}

function bindSettingsEvents() {
  // Tone selector
  document.querySelectorAll('#tone-selector .tone-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic.select();
      document.querySelectorAll('#tone-selector .tone-pill').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Toggle switches (click-based, no input)
  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      haptic.select();
      toggle.classList.toggle('on');
    });
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

  const tone = document.querySelector('#tone-selector .tone-pill.selected')?.dataset.tone || 'balanced';
  const notifOn = document.getElementById('set-notif')?.classList.contains('on') ?? true;
  const morningOn = document.getElementById('set-morning')?.classList.contains('on') ?? true;
  const morningHour = parseInt(document.getElementById('set-morning-hour')?.value) || 8;
  const summaryHour = parseInt(document.getElementById('set-summary-hour')?.value) || 22;

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
    showToast('Ayarlar kaydedildi ✅', 'success');
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
