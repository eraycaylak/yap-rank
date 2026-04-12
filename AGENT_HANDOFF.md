# YAP! Full Mini App Migration — Agent Handoff Document

> Bu doküman, başka bir AI ajanının projeyi tam olarak anlayıp devam edebilmesi için yazılmıştır.
> Son güncelleme: 2026-04-12T23:50 (UTC+3)

---

## 1. PROJE GENCELLEMESİ

**YAP!** bir Telegram alışkanlık takip botu. Kullanıcılar görev tanımlar, bot hatırlatma yapar, görev tamamlanınca XP/seviye/rozet kazanılır. Şu anda **bot üzerinden** yapılan TÜM işlemleri **Telegram Mini App**'e taşıyoruz.

### Yeni Mimari

```
┌─────────────────────────────────────────────────┐
│                  TELEGRAM BOT                    │
│  Sadece bildirim gönderir:                       │
│  • Sabah 08:00 — günaydın + görev özeti          │
│  • Görev saatinde — hatırlatma                   │
│  • Akşam 22:00 — günlük özet                     │
│  • Rozet/seviye kazanma — kutlama                │
│  • Her mesajda "📱 Mini App'i Aç" butonu          │
│                                                   │
│  Bot'tan KALDIRILACAK:                            │
│  /add, /today, /stats, /settings, /streak         │
│  onboarding conversation                          │
│  inline callback (Yaptım, Atla, Ertele)           │
│  addTask text interceptor                         │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│              TELEGRAM MINI APP                   │
│  yaprank.netlify.app                             │
│                                                   │
│  Sekmeler (bottom nav):                           │
│  1. Bugün — görev listesi + tamamla/atla          │
│  2. Profil — XP, seviye, seri, istatistikler      │
│  3. Sıralama — lider tablosu                      │
│  4. Ödüller — rozetler                            │
│  5. Ayarlar — ton, bildirim, saat                 │
│                                                   │
│  Ek Ekranlar:                                     │
│  • Onboarding (ilk giriş) — ADHD anketi + ton     │
│  • Görev Ekle (popup/modal)                       │
│  • Aktivite (son 7 gün)                           │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│               SUPABASE DB                        │
│  Proje: txkhnectxqpjhfipdydq                    │
│  URL: https://txkhnectxqpjhfipdydq.supabase.co  │
│  Anon Key: eyJhbG...Lrl8I (aşağıda tam)          │
└─────────────────────────────────────────────────┘
```

---

## 2. DOSYA YAPILARI

### 2.1 Mini App — `C:\Users\erayc\.gemini\antigravity\scratch\yap-rank\`

```
yap-rank/
├── index.html          ← TEK DOSYA, tüm uygulama (CSS+JS inline)
├── netlify.toml        ← Netlify deploy config
├── assets/
│   └── svg/            ← Rozet ikonları (12 adet)
│       ├── apple.svg
│       ├── boxing.svg
│       ├── carrot.svg
│       ├── chicken.svg
│       ├── coffee.svg
│       ├── donut.svg
│       ├── dumbbell.svg
│       ├── egg.svg
│       ├── grape.svg
│       ├── running.svg
│       ├── scale.svg
│       └── steak.svg
└── README.md
```

**Deploy:** GitHub `eraycaylak/yap-rank` → Netlify auto-deploy → `yaprank.netlify.app`

### 2.2 Bot — `C:\Users\erayc\.gemini\antigravity\scratch\yap-bot\`

```
yap-bot/src/
├── index.ts              ← Express + cron başlatır
├── config.ts             ← Env vars (BOT_TOKEN, SUPABASE_URL vb.)
├── bot/
│   ├── index.ts          ← Grammy bot setup, route'lar
│   ├── context.ts        ← BotContext type
│   ├── commands/          ← /start, /help, /today, /stats, /streak, /settings, /pause, /add
│   ├── callbacks/         ← Inline button handler'ları (Yaptım, Atla, vb.)
│   ├── conversations/     ← onboarding conversation
│   ├── handlers/          ← addTask text handler
│   ├── middleware/         ← auth, rateLimit
│   └── utils/
├── scheduler/
│   ├── index.ts           ← Cron job registry
│   ├── morning-message.ts ← 08:00 sabah mesajı
│   ├── reminder-dispatcher.ts ← görev hatırlatma
│   ├── daily-summary.ts   ← 22:00 günlük özet
│   ├── due-task-checker.ts ← görevleri "due" statüsüne geçir
│   ├── streak-recalc.ts   ← seri hesaplama 
│   └── weekly-report.ts   ← haftalık rapor
├── services/              ← TaskService, UserService, BadgeService vb.
├── db/                    ← Supabase client
├── templates/             ← Mesaj şablonları
└── utils/                 ← Logger vb.
```

**Deploy:** Railway (Docker) — webhook mode

---

## 3. VERİTABANI ŞEMASI

### Supabase Proje Bilgileri
- **Project ID:** `txkhnectxqpjhfipdydq`
- **URL:** `https://txkhnectxqpjhfipdydq.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4a2huZWN0eHFwamhmaXBkeWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTUyOTUsImV4cCI6MjA5MTUzMTI5NX0.d_4W8md2BzpB9ysnpmWUZyT2vkoWXuPft0xeP1Lrl8I`

### Ana Tablolar

| Tablo | Satır | Açıklama |
|---|---|---|
| `users` | 2 | `telegram_id` (bigint, unique), `first_name`, `is_active` |
| `user_profiles` | 2 | `total_xp`, `level`, `current_streak`, `longest_streak`, `perfect_days`, `onboarding_done`, `coins` |
| `user_preferences` | 2 | `tone` (soft/balanced/hard/coach), `notification_enabled`, `morning_message_hour`, `daily_summary_hour` |
| `tasks` | 11 | `title`, `priority` (1-4), `recurrence_type` (daily/weekly/once/custom), `scheduled_time`, `is_deleted` |
| `task_schedules` | 11 | `task_id` → `scheduled_time` (TIME) |
| `task_occurrences` | 10 | `scheduled_date`, `scheduled_time`, `status` (pending/due/completed/skipped/missed/forgiven), `xp_earned` |
| `reminder_jobs` | 1 | `state`, `next_fire_at`, `escalation_level` |
| `reminder_events` | 4 | `event_type` (sent/snoozed/completed/skipped/escalated/cancelled) |
| `streaks` | 2 | `current_streak`, `longest_streak`, `shield_count` |
| `streak_events` | 2 | `event_type` (increment/reset/shield_used vb.) |
| `badges` | 28 | `key`, `name`, `condition_type`, `condition_value` |
| `user_badges` | 0 | `user_id` → `badge_id`, `earned_at` |
| `daily_summaries` | 1 | `tasks_total/completed/skipped/missed`, `xp_earned`, `was_perfect_day` |
| `motivational_message_templates` | 120 | `tone`, `category`, `escalation_level`, `text` |
| `skip_events` | 1 | `skip_type` (today_pass/permanent_skip/roll_over) |

### View

```sql
-- public.leaderboard (SELECT granted to anon)
SELECT ROW_NUMBER() OVER (ORDER BY up.total_xp DESC) AS rank,
       u.id AS user_id, u.telegram_id, u.first_name, u.telegram_username,
       up.total_xp, up.current_streak, up.longest_streak, up.perfect_days, up.level,
       (SELECT COUNT(*) FROM task_occurrences WHERE user_id=u.id AND status='completed') AS completed_tasks
FROM users u JOIN user_profiles up ON up.user_id = u.id WHERE u.is_active = true
```

### RPC Fonksiyonları (Zaten Oluşturuldu ✅)

| Fonksiyon | Parametre | Ne yapar |
|---|---|---|
| `get_user_stats(p_telegram_id bigint)` | telegram_id | Profil + rank döner |
| `get_user_activity(p_telegram_id bigint)` | telegram_id | Son 7 gün activity |
| `miniapp_get_today(p_telegram_id bigint)` | telegram_id | Bugünkü görevler (JSON array) |
| `miniapp_complete_task(p_telegram_id, p_occurrence_id)` | telegram_id + uuid | Görevi tamamlar, XP verir, 30dk kuralı uygular |
| `miniapp_skip_task(p_telegram_id, p_occurrence_id)` | telegram_id + uuid | Görevi atlar |
| `miniapp_add_task(p_telegram_id, p_title, p_scheduled_time, p_priority, p_recurrence)` | çeşitli | Görev + bugünkü occurrence oluşturur |
| `miniapp_save_onboarding(p_telegram_id, p_procrastination_type, p_tone)` | telegram_id + string + string | Ton seçimi kaydeder, +50 XP verir |
| `miniapp_get_settings(p_telegram_id bigint)` | telegram_id | Tüm ayarları döner |
| `miniapp_update_settings(p_telegram_id, p_tone, p_notification_on, p_morning_on, p_morning_hour, p_summary_hour)` | çeşitli | Ayarları günceller |

---

## 4. MEVCUT MINI APP DURUMU

`index.html` şu anda 1087 satır ve şunları içeriyor:

### ✅ Çalışan
- Telegram Mini App SDK (`telegram-web-app.js`) entegre
- `tg.ready()`, `tg.expand()`, `tg.setHeaderColor()`, `tg.setBackgroundColor()`
- `tg.enableClosingConfirmation()`
- `TG_USER = tg.initDataUnsafe?.user` ile gerçek kullanıcı ID alınıyor
- `HapticFeedback` (tap/medium/heavy/success/error/warn/select)
- `tg.MainButton` (sekmecye göre "Bota Dön" veya "Paylaş")
- `tg.BackButton` (diğer sekmelerden Ana Sayfa'ya dön)
- `tg.showPopup()` — rozet detayı, takip
- Supabase RPC çağrıları (`sbRpc` helper)
- 4 sayfa: Ana Sayfa (Profil), Sıralama, Ödüller, Aktivite
- Bottom navigation
- Seviye sistemi (20 seviye, XP bar, yıldızlar)
- Rank badge SVG (bronz/gümüş/altın/platin, seviyeye göre)
- Animasyonlu sayı artışı
- Auto-refresh (90 sn)

### ❌ EKSİK — YAPIILACAKLAR

#### 4.1 Onboarding Ekranı (İlk Giriş)
İlk kez appen açan kullanıcılar için bir quiz/anket akışı:

**Akış:**
1. Karşılama ekranı — "Merhaba {isim}! Seni tanıyalım 🧠"
2. ADHD / Erteleme Anketi (5 soru, her biri çoktan seçmeli):
   - "Bir işe başlamak için en büyük engelin ne?" → Motivasyon eksikliği / Nereden başlayacağımı bilmiyorum / Dikkat dağınıklığı / Mükemmeliyetçilik
   - "Bir görevi ne zaman yaparsın?" → Hemen / Son dakikaya bırakırım / Bağlıdır / Hatırlatılırsa
   - "Günde kaç saat üretken hissediyorsun?" → 1-2 / 3-4 / 5+ / Değişken
   - "Sabah kalktığında ilk ne yaparsın?" → Telefon / Kahve / Egzersiz / İşe başlarım
   - "Bir rutini kaç gün sürdürebiliyorsun?" → 1-3 / 4-7 / 7-14 / 14+
3. Sonuç ekranı — Erteleme profili (4 tip):
   - **Kaçınmacı** — zor görevlerden sakınır
   - **Meşgulcü** — kolay işlerle oyalanır
   - **Mükemmeliyetçi** — başlamaktan korkar
   - **İsyancı** — tahammülsüz/sıkılgan
4. Ton seçimi:
   - Yumuşak 🌸 — nazik, teşvik edici
   - Dengeli ⚖️ — karışık
   - Sert 🔥 — acımasız, zorlayıcı
   - Koç 🏋️ — profesyonel, sistematik
5. +50 XP bonus → `miniapp_save_onboarding` RPC çağrısı

**Kontrol:** `user_profiles.onboarding_done` = false ise göster

#### 4.2 Bugün Sekmesi
Görev listesi + tamamla/atla:

- RPC: `miniapp_get_today(telegram_id)` → görev listesi
- Her görev satırı: saat, başlık, zorluk badge, tamamla butonu
- Tamamla → `miniapp_complete_task` → haptic.success + XP animasyonu + confetti
- Atla → swipe veya long-press → `miniapp_skip_task`
- 30dk kuralı: görev saatinden 30dk öncesine kadar buton disabled, "Henüz vakti gelmedi" ipucu
- Tüm görevler tamamlandıysa → "🎉 Bugün her şeyi bitirdin!" + bonus animasyon
- Alt kısımda "➕ Görev Ekle" butonu

#### 4.3 Görev Ekle (Modal/Popup)
- Title input
- Saat picker (time input)
- Zorluk seçici (1=Kolay, 2=Orta, 3=Zor, 4=Çok Zor)
- Tekrar seçici (Günlük/Haftalık/Tek seferlik)
- "Kaydet" → `miniapp_add_task` RPC → haptic.success → Bugün sekmesini yenile

#### 4.4 Ayarlar Sekmesi
- Bildirim tonu seçici (Yumuşak/Dengeli/Sert/Koç) 
- Sabah mesajı açık/kapalı + saat
- Günlük özet saati
- Bildirimler açık/kapalı
- Kaydet → `miniapp_update_settings` RPC

#### 4.5 Görev Silme/Düzenleme
- Bugün sekmesinde görev üzerine tıkla → detay popup
- "Sil" butonu → görev `is_deleted = true` yap (soft delete)
- Yeni RPC gerekli: `miniapp_delete_task(p_telegram_id, p_task_id)`

#### 4.6 Bottom Nav Güncelleme
Mevcut 4 sekme → 5 sekme:
```
[Bugün] [Profil] [Sıralama] [Ödüller] [Ayarlar]
```
"Aktivite" sekmesini "Profil" içine alt bölüm olarak taşı veya Ayarlar'a koy.

---

## 5. BOT DEĞİŞİKLİKLERİ

### 5.1 Kaldırılacak Dosyalar/Handler'lar

```
src/bot/commands/today.ts       ← SİLİNECEK (mini app'e taşındı)
src/bot/commands/stats.ts       ← SİLİNECEK
src/bot/commands/streak.ts      ← SİLİNECEK
src/bot/commands/settings.ts    ← SİLİNECEK
src/bot/commands/pause.ts       ← SİLİNECEK (ayarlardan yapılacak)
src/bot/conversations/onboarding.ts ← SİLİNECEK (mini app'e taşındı)
src/bot/handlers/add-task.ts    ← SİLİNECEK (mini app'e taşındı)
```

### 5.2 Gücenlenecek Dosyalar

**`src/bot/index.ts`** — Sadece şunlar kalacak:
```ts
bot.command('start', startCommand);  // Yeni /start mesajı
bot.command('help', helpCommand);    // Güncelle
// Diğer tüm komutları ve callback'leri kaldır
// addTask interceptor'ını kaldır
// onboarding conversation'ı kaldır
```

**`src/bot/commands/start.ts`** — Yeni mesaj:
```ts
await ctx.reply(
  `Merhaba ${firstName}! 👋\n\nYAP! artık Mini App üzerinden çalışıyor.\nGörevini ekle, tamamla, sıralamana bak!`,
  { reply_markup: { inline_keyboard: [[
    { text: '📱 Mini App\'i Aç', web_app: { url: 'https://yaprank.netlify.app' } }
  ]]} }
);
```

### 5.3 Scheduler'lara "Mini App Aç" Butonu Ekle

Her bildirim mesajının altına inline web_app butonu eklenmeli:

```ts
const MINIAPP_BUTTON = { text: '📱 Mini App\'i Aç', web_app: { url: 'https://yaprank.netlify.app' } };
```

Güncellenmesi gereken dosyalar:
- `scheduler/morning-message.ts` — mesajın sonuna buton ekle
- `scheduler/reminder-dispatcher.ts` — "Yaptım" callback'i yerine mini app butonu
- `scheduler/daily-summary.ts` — mesajın sonuna buton ekle

---

## 6. TEKNİK DETAYLAR

### 6.1 Telegram Mini App SDK Reference
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

Kullanılan API'ler:
```js
const tg = window.Telegram.WebApp;

// Lifecycle
tg.ready()                           // Mini App hazır
tg.expand()                          // Tam ekran
tg.close()                           // Mini App'i kapat

// Theme
tg.setHeaderColor('#3ECF8E')         // Header rengi
tg.setBackgroundColor('#F0F4FF')     // Arka plan

// User
tg.initDataUnsafe.user.id            // Telegram user ID (bigint)
tg.initDataUnsafe.user.first_name    // İsim

// Haptic
tg.HapticFeedback.impactOccurred('light|medium|heavy')
tg.HapticFeedback.notificationOccurred('success|error|warning')
tg.HapticFeedback.selectionChanged()

// Buttons
tg.MainButton.setParams({text, color, text_color})
tg.MainButton.show() / .hide() / .onClick(fn)
tg.BackButton.show() / .hide() / .onClick(fn)

// Dialogs
tg.showPopup({title, message, buttons: [{id, type, text}]}, callback)
tg.showAlert(text)
tg.showConfirm(text, callback)

// Sharing
tg.switchInlineQuery(text)

// Close confirmation
tg.enableClosingConfirmation()
```

### 6.2 Supabase Erişim Pattern'i
```js
const SB_URL = 'https://txkhnectxqpjhfipdydq.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// View/table okuma
const r = await fetch(`${SB_URL}/rest/v1/leaderboard?select=*&order=rank.asc`, {
  headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
});

// RPC çağrısı
const r = await fetch(`${SB_URL}/rest/v1/rpc/miniapp_get_today`, {
  method: 'POST',
  headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ p_telegram_id: 123456 })
});
```

### 6.3 Seviye Sistemi
```js
const LEVELS = [
  {l:1,xp:0,t:'Yeni Başlayan'}, {l:2,xp:100,t:'Toparlanan'}, {l:3,xp:250,t:'Takipte'},
  {l:4,xp:450,t:'Çabalayan'}, {l:5,xp:700,t:'Düzenli'}, {l:6,xp:1000,t:'Sağlamcı'},
  {l:7,xp:1350,t:'İnatçı'}, {l:8,xp:1750,t:'Odakçı'}, {l:9,xp:2200,t:'Disiplinci'},
  {l:10,xp:2700,t:'YAP! Çırağı'}, {l:11,xp:3300,t:'Seri Kuran'}, {l:12,xp:4000,t:'İradeci'},
  {l:13,xp:4800,t:'Güçlü Rutinci'}, {l:14,xp:5700,t:'Düzen Ustası'}, {l:15,xp:6700,t:'YAP! Ustası'},
  {l:16,xp:7800,t:'İcra Makinesi'}, {l:17,xp:9000,t:'Çelik Rutin'}, {l:18,xp:10300,t:'Sistem Adamı'},
  {l:19,xp:11700,t:'Bitirici'}, {l:20,xp:13200,t:'YAP! Komutanı'}
];
```

### 6.4 XP Hesaplama (miniapp_complete_task içinde)
| Koşul | XP |
|---|---|
| Zorluk 1 (Kolay) | 10 |
| Zorluk 2 (Orta) | 20 |
| Zorluk 3 (Zor) | 35 |
| Zorluk 4 (Çok Zor) | 50 |
| Zamanında bonus (0-30dk önce) | +5 |
| Sabah erken bonus (TR <10:00) | +10 |
| Tüm günlük görevler tamam | +25 |
| Onboarding tamamlama | +50 |

### 6.5 30 Dakika Kuralı
Görev saatinden **30 dakika öncesine kadar** tamamlama butonu disabled. `miniapp_complete_task` fonksiyonu bunu kontrol eder ve `TASK_NOT_YET_DUE` hatası döner.

### 6.6 Tasarım Sistemi
- Font: **Nunito** (body) + **Poppins** (sayılar)
- Ana renk: `#3ECF8E` (yeşil)
- Kart gölgesi: `0 4px 24px rgba(60,80,180,.12)`
- Stat kart renkleri: Mavi `#5B8AF6`, Kırmızı `#F96060`, Mor `#9B6BF9`, Turuncu `#FFB43A`
- Badge renkleri: Bronz (<6), Gümüş (6-10), Altın (11-15), Platin (16+)

---

## 7. ADHD/ERTELEME ANKETİ ARAŞTIRMASI

Onboarding anketi için bilimsel yaklaşım. Erteleme 4 temel tipe ayrılır:

### 7.1 Erteleme Tipleri (Procrastination Types)

| Tip | Türkçe | Özellik | Önerilen Ton |
|---|---|---|---|
| **Avoidant** | Kaçınmacı | Zor/sıkıcı görevlerden kaçar, kaygı kaynaklı | Yumuşak |
| **Busy** | Meşgulcü | Kolay işlerle kendini kandırır, öncelik sorunu | Dengeli |
| **Perfectionist** | Mükemmeliyetçi | "Mükemmel yapamayacaksam hiç yapmayım" | Koç |
| **Rebel** | İsyancı | Dışarıdan gelen beklentilere direnç, sıkıntı | Sert |

### 7.2 Anket Soruları (5 soru)

```
Soru 1: Bir işe başlayamadığında genellikle ne hissedersin?
  A) Kaygı — "Ya yanlış yaparsam?" (Kaçınmacı +2)
  B) Sıkıntı — "Çok zor/uzun sürecek" (Meşgulcü +2)  
  C) Baskı — "Mükemmel olmalı" (Mükemmeliyetçi +2)
  D) İsyan — "Neden yapmak zorundayım ki?" (İsyancı +2)

Soru 2: Yapman gereken zor bir görev var. Ne yaparsın?
  A) Kolay bir şeyle başlarım, sonra geçerim (Meşgulcü +2)
  B) Erken planlarım ama son dakikaya bırakırım (Mükemmeliyetçi +2)
  C) Görmezden gelirim, belki kendiliğinden çözülür (Kaçınmacı +2)
  D) İlk önce bunun gerçekten gerekli olup olmadığını sorgularım (İsyancı +2)

Soru 3: Bir rutini ne kadar sürdürebiliyorsun?
  A) 1-3 gün — hemen sıkılırım (İsyancı +1)
  B) 3-7 gün — başlıyorum ama kopuyorum (Kaçınmacı +1)
  C) 1-2 hafta — bir süre tutuyorum sonra bırakıyorum (Meşgulcü +1)
  D) Uzun süre tutarım ama bir hata yapınca tamamen bırakırım (Mükemmeliyetçi +2)

Soru 4: Sabah kalktığında ilk ne yaparsın?
  A) Telefona bakarım, sosyal medya (Kaçınmacı +1)
  B) Yapılacaklar listesini kontrol ederim (Meşgulcü +1)
  C) Düşünürüm, planlarım, ama başlamam (Mükemmeliyetçi +1)
  D) Canım ne isterse onu yaparım (İsyancı +1)

Soru 5: Bir görevi tamamladığında ne hissedersin?
  A) Rahatlama — "Sonunda bitti" (Kaçınmacı +1)
  B) Hemen sonrakine geçerim — "Liste bitsin" (Meşgulcü +1)
  C) Tatmin — ama eksik kalan yerleri düşünürüm (Mükemmeliyetçi +1)
  D) "Gerekli miydi?" diye düşünürüm (İsyancı +1)
```

### 7.3 Sonuç Hesaplama
Her tip için puan toplanır. En yüksek puan alan tip = kullanıcının erteleme profili.

### 7.4 Profil Sonuç Metinleri

**Kaçınmacı:**
> Zor görevlerden kaçma eğiliminde olan bir yapın var. Kaygı seni durduruyor ama küçük adımlarla başlamak işe yarıyor. YAP! seni nazikçe ama kararlılıkla hatırlatacak.

**Meşgulcü:**
> Sürekli meşgulsün ama gerçek önceliklere ulaşamıyorsun. Kolay işlerle kendini kandırma alışkanlığın var. YAP! sana en önemli görevi önce yaptıracak.

**Mükemmeliyetçi:**
> Mükemmel yapamayacağın şeyi hiç yapmamayı tercih ediyorsun. Ama "yapılmış" her zaman "mükemmel"den iyidir. YAP! sana "yeterince iyi"nin gücünü gösterecek.

**İsyancı:**
> Kuralları sevmiyorsun, zorunluluklar seni bunaltıyor. Ama kendi kurallarını kendin koyduğunda bambaşka biri oluyorsun. YAP! senin kuralların, senin oyunun.

---

## 8. YAPILACAKLAR SIRASI

### Aşama 1: Mini App'e Yeni Sekmeler (Öncelikli)

1. **Onboarding ekranı yaz** — anket + sonuç + ton seçimi + `miniapp_save_onboarding` RPC
2. **Bugün sekmesi yaz** — `miniapp_get_today` + tamamla/atla butonları
3. **Görev ekle modal yaz** — form + `miniapp_add_task` RPC
4. **Ayarlar sekmesi yaz** — `miniapp_get_settings` + `miniapp_update_settings` RPC
5. **Görev silme** — yeni RPC + UI
6. **Bottom nav güncelle** — 5 sekme (Bugün, Profil, Sıralama, Ödüller, Ayarlar)
7. **Onboarding kontrolü** — `get_user_stats` sonucunda `onboarding_done` false ise quiz göster

### Aşama 2: Bot Sadeleştirme

8. **Bot /start mesajını güncelle** — web_app butonu ekle
9. **Scheduler'lara Mini App butonu ekle** — sabah, hatırlatma, özet mesajlarına
10. **Komut handler'larını kaldır** — /today, /stats, /streak, /settings, /add, /pause
11. **Callback handler'larını kaldır** — Yaptım, Atla, Ertele butonları
12. **Onboarding conversation'ı kaldır**
13. **addTask text interceptor'ı kaldır**

### Aşama 3: Deploy

14. **Mini App'i GitHub'a push** → Netlify auto-deploy
15. **Bot'u Railway'e deploy**
16. **BotFather'da Menu Button URL ayarla** → `yaprank.netlify.app`
17. **Test** — gerçek Telegram'da end-to-end test

---

## 9. EKSİK RPC FONKSİYONU

### miniapp_delete_task (henüz oluşturulmadı)
```sql
CREATE OR REPLACE FUNCTION public.miniapp_delete_task(
  p_telegram_id bigint,
  p_task_id     uuid
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE telegram_id = p_telegram_id;
  IF v_user_id IS NULL THEN RETURN '{"error":"USER_NOT_FOUND"}'::json; END IF;
  UPDATE tasks SET is_deleted = true WHERE id = p_task_id AND user_id = v_user_id;
  RETURN '{"success":true}'::json;
END;
$$;
GRANT EXECUTE ON FUNCTION public.miniapp_delete_task(bigint,uuid) TO anon;
```

### miniapp_get_all_tasks (henüz oluşturulmadı — Ayarlar'da görev yönetimi için)
```sql
CREATE OR REPLACE FUNCTION public.miniapp_get_all_tasks(p_telegram_id bigint)
RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(json_agg(row_to_json(x)), '[]'::json) FROM (
    SELECT t.id, t.title, t.priority, t.recurrence_type,
           ts.scheduled_time, t.is_active
    FROM tasks t
    LEFT JOIN task_schedules ts ON ts.task_id = t.id
    JOIN users u ON u.id = t.user_id
    WHERE u.telegram_id = p_telegram_id AND t.is_deleted = false
    ORDER BY ts.scheduled_time
  ) x;
$$;
GRANT EXECUTE ON FUNCTION public.miniapp_get_all_tasks(bigint) TO anon;
```

---

## 10. ÖNEMLİ KURALLAR

1. **Dil:** Tüm UI Türkçe olmalı. İngilizce kelime kullanma.
2. **Emoji kullanma:** SVG ikonlar kullan (`assets/svg/` klasöründe 12 adet var, gerekirse daha fazla SVG path yaz inline)
3. **Tek dosya:** Mini App tek `index.html` dosyası olarak kalsın (CSS+JS inline)
4. **Telegram SDK:** Her zaman `tg.HapticFeedback` kullan (buton tıklama, success, error)
5. **30dk kuralı:** Görev saatinden 30dk öncesine kadar tamamlama engellenecek
6. **Tasarım:** Modern, premium, oyun hissi — gradient'ler, animasyonlar, gölgeler
7. **Auto-refresh:** 90 saniye

---

## 11. ORTAM DEĞİŞKENLERİ

### Bot (.env)
```
BOT_TOKEN=<telegram bot token>
WEBHOOK_SECRET=<rastgele string>
WEBHOOK_URL=https://<railway-url>
SUPABASE_URL=https://txkhnectxqpjhfipdydq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key — gizli>
NODE_ENV=production
PORT=3000
```

### Mini App
Ortam değişkeni yok — `SB_URL` ve `SB_KEY` (anon key) doğrudan index.html içinde tanımlı.
