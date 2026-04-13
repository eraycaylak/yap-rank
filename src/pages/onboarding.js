// ════════════════════════════════════════════════════════════
// ONBOARDING — ADHD / Erteleme Analizi (Premium Full-Screen)
// ════════════════════════════════════════════════════════════
import { haptic } from '../lib/haptic.js';
import { sbRpc } from '../lib/supabase.js';
import { getTgUser } from '../lib/telegram.js';
import { showToast } from '../components/toast.js';
import { launchConfetti } from '../components/confetti.js';

// ── Quiz Data ─────────────────────────────────────────────
const QUESTIONS = [
  {
    q: 'Bir işe başlayamadığında genellikle ne hissedersin?',
    opts: [
      { text: 'Kaygı — "Ya yanlış yaparsam?"', scores: { kacinmaci: 2 } },
      { text: 'Sıkıntı — "Çok zor/uzun sürecek"', scores: { mesgulcu: 2 } },
      { text: 'Baskı — "Mükemmel olmalı"', scores: { mukemmel: 2 } },
      { text: 'İsyan — "Neden yapmak zorundayım ki?"', scores: { isyanci: 2 } },
    ],
  },
  {
    q: 'Yapman gereken zor bir görev var. Ne yaparsın?',
    opts: [
      { text: 'Kolay bir şeyle başlarım, sonra geçerim', scores: { mesgulcu: 2 } },
      { text: 'Erken planlarım ama son dakikaya bırakırım', scores: { mukemmel: 2 } },
      { text: 'Görmezden gelirim, belki kendiliğinden çözülür', scores: { kacinmaci: 2 } },
      { text: 'İlk önce bunun gerekli olup olmadığını sorgularım', scores: { isyanci: 2 } },
    ],
  },
  {
    q: 'Bir rutini ne kadar sürdürebiliyorsun?',
    opts: [
      { text: '1-3 gün — hemen sıkılırım', scores: { isyanci: 1 } },
      { text: '3-7 gün — başlıyorum ama kopuyorum', scores: { kacinmaci: 1 } },
      { text: '1-2 hafta — bir süre tutup sonra bırakıyorum', scores: { mesgulcu: 1 } },
      { text: 'Uzun süre tutarım ama bir hata yapınca bırakırım', scores: { mukemmel: 2 } },
    ],
  },
  {
    q: 'Sabah kalktığında ilk ne yaparsın?',
    opts: [
      { text: 'Telefona bakarım, sosyal medya', scores: { kacinmaci: 1 } },
      { text: 'Yapılacaklar listesini kontrol ederim', scores: { mesgulcu: 1 } },
      { text: 'Düşünürüm, planlarım, ama başlamam', scores: { mukemmel: 1 } },
      { text: 'Canım ne isterse onu yaparım', scores: { isyanci: 1 } },
    ],
  },
  {
    q: 'Bir görevi tamamladığında ne hissedersin?',
    opts: [
      { text: 'Rahatlama — "Sonunda bitti"', scores: { kacinmaci: 1 } },
      { text: 'Hemen sonrakine geçerim — "Liste bitsin"', scores: { mesgulcu: 1 } },
      { text: 'Tatmin — ama eksik kalan yerleri düşünürüm', scores: { mukemmel: 1 } },
      { text: '"Gerekli miydi?" diye düşünürüm', scores: { isyanci: 1 } },
    ],
  },
];

const RESULTS = {
  kacinmaci: {
    title: '🛡️ Kaçınmacı',
    desc: 'Zor görevlerden kaçma eğiliminde olan bir yapın var. Kaygı seni durduruyor ama küçük adımlarla başlamak işe yarıyor.',
    advice: 'YAP! seni nazikçe ama kararlılıkla hatırlatacak.',
    tone: 'soft',
    gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
  },
  mesgulcu: {
    title: '⚡ Meşgulcü',
    desc: 'Sürekli meşgulsün ama gerçek önceliklere ulaşamıyorsun. Kolay işlerle kendini kandırma alışkanlığın var.',
    advice: 'YAP! sana en önemli görevi önce yaptıracak.',
    tone: 'balanced',
    gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
  },
  mukemmel: {
    title: '⭐ Mükemmeliyetçi',
    desc: 'Mükemmel yapamayacağın şeyi hiç yapmamayı tercih ediyorsun. Ama "yapılmış" her zaman "mükemmel"den iyidir.',
    advice: 'YAP! sana "yeterince iyi"nin gücünü gösterecek.',
    tone: 'coach',
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  },
  isyanci: {
    title: '🔥 İsyancı',
    desc: 'Kuralları sevmiyorsun, zorunluluklar seni bunaltıyor. Ama kendi kurallarını kendin koyduğunda bambaşka biri oluyorsun.',
    advice: 'YAP! senin kuralların, senin oyunun.',
    tone: 'hard',
    gradient: 'linear-gradient(135deg, #f87171, #ef4444)',
  },
};

const TONES = [
  { key: 'soft', name: 'Yumuşak', desc: 'Nazik ve teşvik edici', emoji: '💜', color: '#a78bfa' },
  { key: 'balanced', name: 'Dengeli', desc: 'Karışık yaklaşım', emoji: '💙', color: '#60a5fa' },
  { key: 'hard', name: 'Sert', desc: 'Acımasız ve zorlayıcı', emoji: '🔥', color: '#f87171' },
  { key: 'coach', name: 'Koç', desc: 'Profesyonel ve sistematik', emoji: '🏆', color: '#fbbf24' },
];

// ── State ─────────────────────────────────────────────────
let step = 0; // 0=welcome, 1-5=questions, 6=result, 7=tone
let answers = [];
let selectedTone = null;
let resultType = null;
let onDoneCallback = null;

const TOTAL_STEPS = 8;

// ── Public API ────────────────────────────────────────────
export function showOnboarding(onComplete) {
  onDoneCallback = onComplete;
  step = 0;
  answers = [];
  selectedTone = null;
  resultType = null;

  const el = document.getElementById('onboarding');
  el.style.display = 'flex';
  document.getElementById('bottom-nav').classList.add('hidden');

  render();
}

export function hideOnboarding() {
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('bottom-nav').classList.remove('hidden');
}

// ── Render ────────────────────────────────────────────────
function render() {
  const el = document.getElementById('onboarding');

  // Progress dots
  const dots = Array.from({ length: TOTAL_STEPS }, (_, i) => {
    if (i < step) return '<div class="ob-dot done"></div>';
    if (i === step) return '<div class="ob-dot active"></div>';
    return '<div class="ob-dot"></div>';
  }).join('');

  let body = '';

  if (step === 0) {
    const name = getTgUser()?.first_name || 'Kullanıcı';
    body = `
      <div class="ob-container" style="animation: scale-in .5s cubic-bezier(.22,1,.36,1) both">
        <div style="text-align:center;margin-bottom:2rem">
          <div style="font-size:3.5rem;margin-bottom:.5rem">🧠</div>
          <div class="ob-question" style="margin-bottom:.5rem">Merhaba, ${name}!</div>
          <div style="color:rgba(255,255,255,.65);font-size:.9rem;font-weight:600;line-height:1.6;max-width:300px;margin:0 auto">
            Seni tanıyalım ve alışkanlık yolculuğunu kişiselleştirelim.<br>
            <strong style="color:rgba(255,255,255,.85)">5 kısa soru</strong> ile erteleme profilini belirleyeceğiz.
          </div>
        </div>
        <button class="ob-cta" data-action="next">Başlayalım 🚀</button>
      </div>
    `;
  } else if (step >= 1 && step <= 5) {
    const qi = step - 1;
    const q = QUESTIONS[qi];
    const letters = ['A', 'B', 'C', 'D'];

    const opts = q.opts.map((o, i) => `
      <button class="ob-answer ${answers[qi] === i ? 'selected' : ''}" data-opt="${i}">
        <span style="background:rgba(255,255,255,.08);width:26px;height:26px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;flex-shrink:0;margin-right:.6rem">${letters[i]}</span>
        ${o.text}
      </button>
    `).join('');

    body = `
      <div class="ob-container" style="animation: slide-up .4s cubic-bezier(.22,1,.36,1) both">
        <div style="text-align:center;margin-bottom:1.2rem">
          <div style="font-size:.65rem;font-weight:900;color:var(--green);text-transform:uppercase;letter-spacing:.2em;margin-bottom:.5rem">Soru ${qi + 1} / 5</div>
          <div class="ob-question">${q.q}</div>
        </div>
        <div class="ob-answers">${opts}</div>
        <div style="margin-top:1.2rem">
          <button class="ob-cta" data-action="next" ${answers[qi] === undefined ? 'disabled' : ''}>${qi === 4 ? 'Sonucu Gör ✨' : 'Devam Et →'}</button>
        </div>
      </div>
    `;
  } else if (step === 6) {
    resultType = calcResult();
    const r = RESULTS[resultType];

    body = `
      <div class="ob-container" style="animation: scale-in .5s cubic-bezier(.22,1,.36,1) both">
        <div class="ob-result">
          <div class="ob-result-icon" style="background:${r.gradient}">${r.title.split(' ')[0]}</div>
          <div style="font-size:.7rem;font-weight:800;color:var(--green);text-transform:uppercase;letter-spacing:.2em;margin-bottom:.3rem">Erteleme Profilin</div>
          <div class="ob-result-type">${r.title.split(' ').slice(1).join(' ')}</div>
          <div class="ob-result-desc">${r.desc}</div>
          <div style="background:rgba(62,207,142,.08);border:1px solid rgba(62,207,142,.2);border-radius:12px;padding:.75rem 1rem;font-size:.82rem;color:rgba(255,255,255,.85);font-weight:700;line-height:1.5">
            💡 ${r.advice}
          </div>
        </div>
        <div style="margin-top:1.5rem">
          <button class="ob-cta" data-action="next">Tonumu Seçeyim →</button>
        </div>
      </div>
    `;
  } else if (step === 7) {
    const recommended = resultType ? RESULTS[resultType].tone : null;

    const cards = TONES.map(t => `
      <button class="tone-card ${selectedTone === t.key ? 'selected' : ''}" data-tone="${t.key}">
        <div class="tone-icon">${t.emoji}</div>
        <div style="font-weight:900;font-size:.85rem;color:#fff;margin-bottom:.15rem">${t.name}</div>
        <div style="font-size:.7rem;color:rgba(255,255,255,.55);font-weight:600">${t.desc}</div>
        ${recommended === t.key ? '<div style="font-size:.55rem;font-weight:900;color:var(--green);margin-top:.3rem;text-transform:uppercase;letter-spacing:.1em">⭐ Önerilen</div>' : ''}
      </button>
    `).join('');

    body = `
      <div class="ob-container" style="animation: slide-up .4s cubic-bezier(.22,1,.36,1) both">
        <div style="text-align:center;margin-bottom:1.2rem">
          <div style="font-size:.65rem;font-weight:900;color:var(--green);text-transform:uppercase;letter-spacing:.2em;margin-bottom:.5rem">Son Adım</div>
          <div class="ob-question">Bildirim tonunu seç</div>
          <div style="color:rgba(255,255,255,.5);font-size:.78rem;font-weight:600">Hatırlatmalar ve motivasyon mesajlarının tarzı</div>
        </div>
        <div class="tone-grid">${cards}</div>
        <button class="ob-cta" data-action="finish" ${!selectedTone ? 'disabled' : ''}>Başlayalım 🎯 (+50 XP)</button>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="ob-progress">${dots}</div>
    ${body}
  `;

  bindEvents();
}

// ── Events ────────────────────────────────────────────────
function bindEvents() {
  const el = document.getElementById('onboarding');

  // Answer selections
  el.querySelectorAll('.ob-answer').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic.select();
      answers[step - 1] = parseInt(btn.dataset.opt);
      render();
    });
  });

  // Tone selections
  el.querySelectorAll('.tone-card').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic.select();
      selectedTone = btn.dataset.tone;
      render();
    });
  });

  // CTA buttons
  el.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (btn.dataset.action === 'next') {
        haptic.tap();
        step++;
        render();
      } else if (btn.dataset.action === 'finish') {
        await finishOnboarding();
      }
    });
  });
}

// ── Logic ─────────────────────────────────────────────────
function calcResult() {
  const scores = { kacinmaci: 0, mesgulcu: 0, mukemmel: 0, isyanci: 0 };
  answers.forEach((ansIdx, qIdx) => {
    if (ansIdx === undefined) return;
    const opt = QUESTIONS[qIdx].opts[ansIdx];
    for (const [type, pts] of Object.entries(opt.scores)) {
      scores[type] += pts;
    }
  });
  let max = 'kacinmaci', maxS = 0;
  for (const [t, s] of Object.entries(scores)) {
    if (s > maxS) { maxS = s; max = t; }
  }
  return max;
}

async function finishOnboarding() {
  if (!selectedTone) return;
  haptic.heavy();

  const user = getTgUser();
  if (!user) { showToast('Kullanıcı bulunamadı', 'error'); return; }

  const btn = document.querySelector('[data-action="finish"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }

  try {
    const r = await sbRpc('miniapp_save_onboarding', {
      p_telegram_id: user.id,
      p_procrastination_type: resultType,
      p_tone: selectedTone,
    });
    const data = await r.json();

    if (!r.ok || data?.error) {
      showToast('Kayıt hatası', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Tekrar Dene'; }
      return;
    }

    haptic.success();
    launchConfetti();
    showToast('+50 XP kazandın! 🎉', 'xp');

    hideOnboarding();
    if (onDoneCallback) onDoneCallback();
  } catch {
    haptic.error();
    showToast('Bağlantı hatası', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Tekrar Dene'; }
  }
}
