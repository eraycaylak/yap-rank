// ════════════════════════════════════════════════════════════
// ONBOARDING — ADHD / Erteleme Anketi
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
      { text: 'İlk önce bunun gerçekten gerekli olup olmadığını sorgularım', scores: { isyanci: 2 } },
    ],
  },
  {
    q: 'Bir rutini ne kadar sürdürebiliyorsun?',
    opts: [
      { text: '1-3 gün — hemen sıkılırım', scores: { isyanci: 1 } },
      { text: '3-7 gün — başlıyorum ama kopuyorum', scores: { kacinmaci: 1 } },
      { text: '1-2 hafta — bir süre tutuyorum sonra bırakıyorum', scores: { mesgulcu: 1 } },
      { text: 'Uzun süre tutarım ama bir hata yapınca tamamen bırakırım', scores: { mukemmel: 2 } },
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
    title: 'Kaçınmacı',
    desc: 'Zor görevlerden kaçma eğiliminde olan bir yapın var. Kaygı seni durduruyor ama küçük adımlarla başlamak işe yarıyor. YAP! seni nazikçe ama kararlılıkla hatırlatacak.',
    tone: 'soft',
    icon: `<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z"/></svg>`,
  },
  mesgulcu: {
    title: 'Meşgulcü',
    desc: 'Sürekli meşgulsün ama gerçek önceliklere ulaşamıyorsun. Kolay işlerle kendini kandırma alışkanlığın var. YAP! sana en önemli görevi önce yaptıracak.',
    tone: 'balanced',
    icon: `<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
  },
  mukemmel: {
    title: 'Mükemmeliyetçi',
    desc: 'Mükemmel yapamayacağın şeyi hiç yapmamayı tercih ediyorsun. Ama "yapılmış" her zaman "mükemmel"den iyidir. YAP! sana "yeterince iyi"nin gücünü gösterecek.',
    tone: 'coach',
    icon: `<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  },
  isyanci: {
    title: 'İsyancı',
    desc: 'Kuralları sevmiyorsun, zorunluluklar seni bunaltıyor. Ama kendi kurallarını kendin koyduğunda bambaşka biri oluyorsun. YAP! senin kuralların, senin oyunun.',
    tone: 'hard',
    icon: `<svg viewBox="0 0 24 24" fill="#fff"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12a1.44 1.44 0 01-.14-.17C6.97 12.1 6.7 9.71 7.47 7.75 5.55 9.44 4.5 11.96 4.5 14.5c0 4.15 3.35 7.5 7.5 7.5s7.5-3.35 7.5-7.5c0-1.35-.37-2.71-1.12-3.85L17.66 11.2z"/></svg>`,
  },
};

const TONES = [
  { key: 'soft', name: 'Yumuşak', desc: 'Nazik ve teşvik edici', color: '#a78bfa', icon: `<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>` },
  { key: 'balanced', name: 'Dengeli', desc: 'Karışık yaklaşım', color: '#60a5fa', icon: `<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>` },
  { key: 'hard', name: 'Sert', desc: 'Acımasız ve zorlayıcı', color: '#f87171', icon: `<svg viewBox="0 0 24 24" fill="#fff"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12C6.97 12.1 6.7 9.71 7.47 7.75 5.55 9.44 4.5 11.96 4.5 14.5c0 4.15 3.35 7.5 7.5 7.5s7.5-3.35 7.5-7.5c0-1.35-.37-2.71-1.12-3.85z"/></svg>` },
  { key: 'coach', name: 'Koç', desc: 'Profesyonel ve sistematik', color: '#fbbf24', icon: `<svg viewBox="0 0 24 24" fill="#fff"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/></svg>` },
];

// ── State ─────────────────────────────────────────────────
let currentStep = 0; // 0=welcome, 1-5=questions, 6=result, 7=tone
let answers = [];
let selectedTone = null;
let resultType = null;
let onCompleteCallback = null;

const TOTAL_STEPS = 8; // welcome + 5 questions + result + tone

// ── Public API ────────────────────────────────────────────
export function showOnboarding(onComplete) {
  onCompleteCallback = onComplete;
  currentStep = 0;
  answers = [];
  selectedTone = null;
  resultType = null;

  const overlay = document.getElementById('onboarding');
  overlay.style.display = 'flex';
  document.getElementById('bottom-nav').classList.add('hidden');

  renderStep();
}

export function hideOnboarding() {
  const overlay = document.getElementById('onboarding');
  overlay.style.display = 'none';
  document.getElementById('bottom-nav').classList.remove('hidden');
}

// ── Render ────────────────────────────────────────────────
function renderStep() {
  const overlay = document.getElementById('onboarding');
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  let stepHTML = '';

  if (currentStep === 0) {
    const user = getTgUser();
    const name = user?.first_name || 'Kullanıcı';
    stepHTML = renderWelcome(name);
  } else if (currentStep >= 1 && currentStep <= 5) {
    stepHTML = renderQuestion(currentStep - 1);
  } else if (currentStep === 6) {
    resultType = calculateResult();
    stepHTML = renderResult(resultType);
  } else if (currentStep === 7) {
    stepHTML = renderToneSelection();
  }

  overlay.innerHTML = `
    <div class="ob-progress"><div class="ob-progress-fill" style="width:${progress}%"></div></div>
    ${stepHTML}
  `;

  bindStepEvents();
}

function renderWelcome(name) {
  return `
    <div class="ob-step ob-welcome">
      <div class="ob-welcome-icon">
        <svg viewBox="0 0 24 24" fill="#fff" width="40" height="40">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z"/>
        </svg>
      </div>
      <div class="ob-welcome-title">Merhaba, ${name}!</div>
      <div class="ob-welcome-sub">Seni tanıyalım ve alışkanlık yolculuğunu kişiselleştirelim. 5 kısa soru ile erteleme profilini belirleyeceğiz.</div>
    </div>
    <div class="ob-actions">
      <button class="ob-btn ob-btn-primary" data-action="next">Başlayalım</button>
    </div>
  `;
}

function renderQuestion(idx) {
  const q = QUESTIONS[idx];
  const letters = ['A', 'B', 'C', 'D'];

  const optsHTML = q.opts.map((opt, i) => `
    <button class="ob-option ${answers[idx] === i ? 'selected' : ''}" data-opt="${i}">
      <span class="ob-option-letter">${letters[i]}</span>
      <span class="ob-option-text">${opt.text}</span>
    </button>
  `).join('');

  return `
    <div class="ob-step">
      <div class="ob-question-num">Soru ${idx + 1} / 5</div>
      <div class="ob-question-text">${q.q}</div>
      <div class="ob-options">${optsHTML}</div>
    </div>
    <div class="ob-actions">
      <button class="ob-btn ob-btn-primary" data-action="next" ${answers[idx] === undefined ? 'disabled' : ''}>
        ${idx === 4 ? 'Sonucu Gör' : 'Devam Et'}
      </button>
    </div>
  `;
}

function renderResult(type) {
  const r = RESULTS[type];
  return `
    <div class="ob-step ob-result">
      <div class="ob-result-badge ${type}">${r.icon}</div>
      <div class="ob-result-type">Erteleme profilin</div>
      <div class="ob-result-title">${r.title}</div>
      <div class="ob-result-desc">${r.desc}</div>
    </div>
    <div class="ob-actions">
      <button class="ob-btn ob-btn-primary" data-action="next">Tonumu Seçeyim</button>
    </div>
  `;
}

function renderToneSelection() {
  const recommended = resultType ? RESULTS[resultType].tone : null;

  const cards = TONES.map(t => `
    <button class="ob-tone-card ${selectedTone === t.key ? 'selected' : ''}" data-tone="${t.key}">
      <div class="ob-tone-icon" style="background:${t.color}">${t.icon}</div>
      <div class="ob-tone-name">${t.name} ${recommended === t.key ? '(Önerilen)' : ''}</div>
      <div class="ob-tone-desc">${t.desc}</div>
    </button>
  `).join('');

  return `
    <div class="ob-step">
      <div class="ob-question-num">Son adım</div>
      <div class="ob-question-text">Bildirim tonunu seç</div>
      <div class="ob-tone-grid">${cards}</div>
    </div>
    <div class="ob-actions">
      <button class="ob-btn ob-btn-primary" data-action="finish" ${!selectedTone ? 'disabled' : ''}>
        Başlayalım (+50 XP)
      </button>
    </div>
  `;
}

// ── Events ────────────────────────────────────────────────
function bindStepEvents() {
  const overlay = document.getElementById('onboarding');

  // Option selection (questions)
  overlay.querySelectorAll('.ob-option').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic.select();
      const idx = parseInt(btn.dataset.opt);
      answers[currentStep - 1] = idx;
      renderStep();
    });
  });

  // Tone selection
  overlay.querySelectorAll('.ob-tone-card').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic.select();
      selectedTone = btn.dataset.tone;
      renderStep();
    });
  });

  // Next / Finish buttons
  overlay.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;

      if (action === 'next') {
        haptic.tap();
        currentStep++;
        renderStep();
      } else if (action === 'finish') {
        await finishOnboarding();
      }
    });
  });
}

// ── Logic ─────────────────────────────────────────────────
function calculateResult() {
  const scores = { kacinmaci: 0, mesgulcu: 0, mukemmel: 0, isyanci: 0 };

  answers.forEach((ansIdx, qIdx) => {
    if (ansIdx === undefined) return;
    const opt = QUESTIONS[qIdx].opts[ansIdx];
    for (const [type, pts] of Object.entries(opt.scores)) {
      scores[type] += pts;
    }
  });

  // Find highest scoring type
  let maxType = 'kacinmaci';
  let maxScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) { maxScore = score; maxType = type; }
  }

  return maxType;
}

async function finishOnboarding() {
  if (!selectedTone) return;
  haptic.heavy();

  const user = getTgUser();
  if (!user) {
    showToast('Kullanıcı bulunamadı', 'error');
    return;
  }

  try {
    const r = await sbRpc('miniapp_save_onboarding', {
      p_telegram_id: user.id,
      p_procrastination_type: resultType,
      p_tone: selectedTone,
    });
    const data = await r.json();

    if (data?.error) {
      showToast('Kayıt hatası', 'error');
      return;
    }

    haptic.success();
    launchConfetti();
    showToast('+50 XP kazandın!', 'xp');

    hideOnboarding();
    if (onCompleteCallback) onCompleteCallback();
  } catch (e) {
    haptic.error();
    showToast('Bağlantı hatası', 'error');
  }
}
