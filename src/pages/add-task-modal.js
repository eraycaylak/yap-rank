// ════════════════════════════════════════════════════════════
// ADD TASK MODAL — Bottom sheet form
// ════════════════════════════════════════════════════════════
import { haptic } from '../lib/haptic.js';
import { sbRpc } from '../lib/supabase.js';
import { getTgUser } from '../lib/telegram.js';
import { showToast } from '../components/toast.js';

let onSaveCallback = null;

export function showAddTaskModal(onSave) {
  onSaveCallback = onSave;
  const modal = document.getElementById('modal-add-task');
  modal.style.display = 'flex';

  modal.innerHTML = `
    <div class="modal-sheet" id="add-task-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Görev Ekle</div>

      <div class="form-group">
        <label class="form-label">Başlık</label>
        <input class="form-input" id="task-title-input" type="text" placeholder="Örn: Sabah koşusu" maxlength="50" autocomplete="off"/>
      </div>

      <div class="form-group">
        <label class="form-label">Saat</label>
        <input class="form-input" id="task-time-input" type="time" value="09:00" style="width:140px"/>
      </div>

      <div class="form-group">
        <label class="form-label">Zorluk</label>
        <div class="pill-group">
          <button class="pill-btn" data-p="1">Kolay</button>
          <button class="pill-btn selected" data-p="2">Orta</button>
          <button class="pill-btn" data-p="3">Zor</button>
          <button class="pill-btn" data-p="4">Çok Zor</button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Tekrar</label>
        <div class="pill-group">
          <button class="pill-btn selected" data-r="daily">Günlük</button>
          <button class="pill-btn" data-r="weekly">Haftalık</button>
          <button class="pill-btn" data-r="once">Tek Sefer</button>
        </div>
      </div>

      <button class="modal-submit" id="task-save-btn">Kaydet</button>
    </div>
  `;

  // Bind events
  // Priority selector
  modal.querySelectorAll('[data-p]').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic.select();
      modal.querySelectorAll('[data-p]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Recurrence selector
  modal.querySelectorAll('[data-r]').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic.select();
      modal.querySelectorAll('[data-r]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Save
  document.getElementById('task-save-btn').addEventListener('click', saveTask);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Focus title
  setTimeout(() => document.getElementById('task-title-input')?.focus(), 300);
}

function closeModal() {
  const modal = document.getElementById('modal-add-task');
  modal.style.display = 'none';
  modal.innerHTML = '';
}

async function saveTask() {
  const title = document.getElementById('task-title-input')?.value?.trim();
  const time = document.getElementById('task-time-input')?.value;
  const priority = document.querySelector('[data-p].selected')?.dataset.p || '2';
  const recurrence = document.querySelector('[data-r].selected')?.dataset.r || 'daily';

  if (!title) {
    haptic.error();
    showToast('Görev başlığı gerekli', 'error');
    return;
  }

  const user = getTgUser();
  if (!user) {
    showToast('Kullanıcı bulunamadı', 'error');
    return;
  }

  haptic.heavy();
  const btn = document.getElementById('task-save-btn');
  btn.disabled = true;
  btn.textContent = 'Kaydediliyor...';

  try {
    const r = await sbRpc('miniapp_add_task', {
      p_telegram_id: user.id,
      p_title: title,
      p_scheduled_time: time + ':00',
      p_priority: parseInt(priority),
      p_recurrence: recurrence,
    });
    const data = await r.json();

    if (data?.error) {
      haptic.error();
      showToast('Kayıt hatası', 'error');
      btn.disabled = false;
      btn.textContent = 'Kaydet';
      return;
    }

    haptic.success();
    showToast('Görev eklendi! 🎯', 'success');
    closeModal();
    if (onSaveCallback) onSaveCallback();
  } catch {
    haptic.error();
    showToast('Bağlantı hatası', 'error');
    btn.disabled = false;
    btn.textContent = 'Kaydet';
  }
}
