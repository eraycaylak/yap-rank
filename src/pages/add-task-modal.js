// ════════════════════════════════════════════════════════════
// ADD TASK MODAL — Bottom sheet form with icon picker
// ════════════════════════════════════════════════════════════
import { haptic } from '../lib/haptic.js';
import { sbRpc } from '../lib/supabase.js';
import { getTgUser } from '../lib/telegram.js';
import { showToast } from '../components/toast.js';

let onSaveCallback = null;

// ── Görev ikonları ──
const TASK_ICONS = [
  { id: 'apple',      label: 'Meyve',      src: '/assets/svg/apple.svg' },
  { id: 'running',    label: 'Koşu',       src: '/assets/svg/running.svg' },
  { id: 'dumbbell',   label: 'Spor',       src: '/assets/svg/dumbbell.svg' },
  { id: 'coffee',     label: 'Kahve',      src: '/assets/svg/coffee.svg' },
  { id: 'egg',        label: 'Kahvaltı',   src: '/assets/svg/egg-svgrepo-com.svg' },
  { id: 'bread',      label: 'Ekmek',      src: '/assets/svg/bread-svgrepo-com.svg' },
  { id: 'chicken',    label: 'Yemek',      src: '/assets/svg/chicken-svgrepo-com.svg' },
  { id: 'fish',       label: 'Balık',      src: '/assets/svg/fish-svgrepo-com.svg' },
  { id: 'cake',       label: 'Tatlı',      src: '/assets/svg/cake-svgrepo-com.svg' },
  { id: 'orange',     label: 'Portakal',   src: '/assets/svg/orange-svgrepo-com.svg' },
  { id: 'strawberry', label: 'Çilek',      src: '/assets/svg/strawberry-svgrepo-com.svg' },
  { id: 'pizza',      label: 'Pizza',      src: '/assets/svg/pizza-svgrepo-com.svg' },
  { id: 'lemon',      label: 'Limon',      src: '/assets/svg/lemon-svgrepo-com.svg' },
  { id: 'carrot',     label: 'Havuç',      src: '/assets/svg/carrot-svgrepo-com.svg' },
  { id: 'grape',      label: 'Üzüm',       src: '/assets/svg/grape-svgrepo-com.svg' },
  { id: 'hamburger',  label: 'Hamburger',  src: '/assets/svg/hamburger-svgrepo-com.svg' },
  { id: 'hotdog',     label: 'Sosisli',    src: '/assets/svg/hot-dog-svgrepo-com.svg' },
  { id: 'lollipop',   label: 'Şeker',      src: '/assets/svg/lollipop-svgrepo-com.svg' },
];

// Export for use in today.js
export { TASK_ICONS };

export function showAddTaskModal(onSave) {
  onSaveCallback = onSave;
  const modal = document.getElementById('modal-add-task');
  modal.style.display = 'flex';

  const iconGrid = TASK_ICONS.map((icon, i) => `
    <button class="icon-pick ${i === 0 ? 'selected' : ''}" data-icon="${icon.id}" data-icon-src="${icon.src}" title="${icon.label}">
      <img src="${icon.src}" alt="${icon.label}" loading="lazy"/>
    </button>
  `).join('');

  modal.innerHTML = `
    <div class="modal-sheet" id="add-task-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Görev Ekle</div>

      <div class="form-group">
        <label class="form-label">İkon Seç</label>
        <div class="icon-picker">${iconGrid}</div>
      </div>

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

  // ── Bind events ──

  // Icon picker
  modal.querySelectorAll('.icon-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic.select();
      modal.querySelectorAll('.icon-pick').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

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
  const iconId = document.querySelector('.icon-pick.selected')?.dataset.icon || 'apple';

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
      p_title: `${iconId}::${title}`,
      p_scheduled_time: time + ':00',
      p_priority: parseInt(priority),
      p_recurrence: recurrence,
    });

    const data = await r.json();

    if (!r.ok || (data?.error && data.error !== 'null')) {
      haptic.error();
      showToast('Kayıt hatası: ' + (data?.error || r.status), 'error');
      btn.disabled = false;
      btn.textContent = 'Kaydet';
      return;
    }

    haptic.success();
    showToast('Görev eklendi! 🎯', 'success');
    closeModal();
    if (onSaveCallback) onSaveCallback();
  } catch (e) {
    haptic.error();
    showToast('Bağlantı hatası', 'error');
    btn.disabled = false;
    btn.textContent = 'Kaydet';
  }
}
