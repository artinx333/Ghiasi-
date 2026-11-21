const form = document.getElementById("chatForm");
const input = document.getElementById("userInput");
const messages = document.getElementById("messages");
const micBtn = document.getElementById("micBtn");
const statusText = document.getElementById("status");
const bubble = document.getElementById("bubble");
const voiceToggle = document.getElementById("voiceToggle");

let voiceOn = true;
let recognition = null;
let listening = false;

const replies = [
  { test: /سلام|درود|hi|hello/i, answers: ["سلام به روی ماهت! چه عجب از این طرفا؟ 😄", "سلام! بگو ببینم امروز چه نقشه‌ای داری؟", "به‌به! جلسه رسمی شروع شد؛ فقط صورت‌جلسه نمی‌نویسیم! 😂"] },
  { test: /خوبی|چطوری|حالت چطوره/i, answers: ["من خوبم، تو خوبی؟ یا اومدی مشکلاتتو بندازی گردن من؟ 😂", "عالی‌ام! در حدی که حتی وای‌فای هم ازم انرژی می‌گیره.", "خوبم؛ ممنون که بالاخره یکی احوالمو پرسید!"] },
  { test: /اسمت چیه|اسم تو چیه|کی هستی/i, answers: ["من قیاسی‌ام؛ نسخه جیبیِ شوخی و جواب‌های دم‌دستی! 😎", "قیاسی! اسممو یادت بمونه، شاید یه روز امتحان گرفتم."] },
  { test: /جوک|بخندون|لطیفه/i, answers: ["یه نفر رفت دکتر گفت حافظه‌م ضعیفه. دکتر گفت از کی؟ گفت چی از کی؟ 😂", "به کامپیوتر گفتم چرا سردته؟ گفت چون ویندوزم بازه! 🤣", "رفتم باشگاه ثبت‌نام کنم، گفتن هدفت چیه؟ گفتم فعلاً پیدا کردن جای پارک!"] },
  { test: /خسته|حوصله|بی حوصله/i, answers: ["پس بیا یه موضوع باحال پیدا کنیم؛ البته مسئولیت حوصله‌ات با خودته! 😁", "یه استراحت کوچولو بکن. حتی گوشی هم گاهی شارژ می‌خواد، چه برسه به آدمیزاد."] },
  { test: /خداحافظ|فعلا|بای|بدرود/i, answers: ["فعلاً! ولی زود برگرد، من اینجا با دیوار حرف می‌زنم! 😂", "بای بای! مراقب خودت باش و کمتر دردسر درست کن."] },
  { test: /ژائو|فلیکس|jo[aã]o/i, answers: ["اوه اوه! بحث ژائو فلیکس شد؟ بالاخره رسیدیم به موضوعات مهم زندگی! 😎", "ژائو فلیکس؟ سلیقه فوتبالی‌ات قابل بحثه، ولی فعلاً تأیید شد! 😂"] },
  { test: /فوتبال|مسی|رونالدو|بارسا|رئال/i, answers: ["فوتبال؟ من آماده‌ام؛ فقط آخرش دعوا سر مسی و رونالدو راه نندازیم! ⚽", "چه تیمی رو دوست داری؟ قول نمی‌دم قضاوتت نکنم! 😂"] },
  { test: /درس|امتحان|ریاضی|علوم/i, answers: ["درس؟ باشه، شوخی رو کم می‌کنم. سؤالت رو دقیق بفرست تا با هم حلش کنیم. 📚", "امتحان نزدیکه؟ نگران نباش، قدم‌به‌قدم پیش می‌ریم. فقط کتاب رو هم باز کن، معجزه که نیست! 😄"] },
  { test: /دوستت دارم|عاشقتم/i, answers: ["چه محبت پرشوری! منم از گپ زدن باهات خوشم میاد؛ حالا سؤال بعدی؟ 😄", "قربون معرفتت! البته من یه هوش مصنوعی‌ام، زیادی جدی نگیر! 😂"] }
];

const fallback = [
  "جالبه! یکم بیشتر توضیح می‌دی تا درست جواب بدم؟",
  "این یکی رو باید بیشتر بازش کنیم. منظورت دقیقاً چیه؟ 🤔",
  "سؤال خوبیه! من جواب آماده‌ای براش ندارم، ولی می‌تونیم با هم بررسیش کنیم.",
  "صبر کن ببینم... مغزم که ندارم، ولی پردازنده‌م داره دود می‌کنه! 😂 یکم واضح‌تر بگو.",
  "خب، این موضوع ارزش یه گفت‌وگوی درست‌وحسابی رو داره. بیشتر بگو!"
];

function addMessage(type, text) {
  const el = document.createElement("div");
  el.className = `msg ${type}`;
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

function chooseReply(text) {
  const normalized = text.toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک");
  const match = replies.find(item => item.test.test(normalized));
  const choices = match ? match.answers : fallback;
  return choices[Math.floor(Math.random() * choices.length)];
}

function speak(text) {
  if (!voiceOn || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fa-IR";
  utterance.rate = 1.02;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
}

function sendMessage(text) {
  const clean = text.trim();
  if (!clean) return;
  addMessage("user", clean);
  input.value = "";
  statusText.textContent = "قیاسی داره فکر می‌کنه... البته در حد خودش! 🤔";
  const answer = chooseReply(clean);
  window.setTimeout(() => {
    addMessage("bot", answer);
    bubble.textContent = answer;
    speak(answer);
    statusText.textContent = "نوبت توئه؛ ادامه بده!";
  }, 450);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  sendMessage(input.value);
});

voiceToggle.addEventListener("click", () => {
  voiceOn = !voiceOn;
  voiceToggle.textContent = voiceOn ? "🔊 صدا روشن" : "🔇 صدا خاموش";
  if (!voiceOn) window.speechSynthesis?.cancel();
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "fa-IR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    listening = true;
    micBtn.classList.add("listening");
    micBtn.textContent = "⏹️";
    statusText.textContent = "دارم گوش می‌دم... صحبت کن!";
  };
  recognition.onresult = event => {
    const spokenText = event.results[0][0].transcript;
    input.value = spokenText;
    sendMessage(spokenText);
  };
  recognition.onerror = event => {
    statusText.textContent = event.error === "not-allowed"
      ? "دسترسی میکروفون داده نشد؛ از تنظیمات مرورگر فعالش کن."
      : "صدات رو نگرفتم؛ دوباره امتحان کن.";
  };
  recognition.onend = () => {
    listening = false;
    micBtn.classList.remove("listening");
    micBtn.textContent = "🎙️";
  };
  micBtn.addEventListener("click", () => {
    if (listening) recognition.stop();
    else {
      window.speechSynthesis?.cancel();
      try { recognition.start(); }
      catch { statusText.textContent = "میکروفون مشغوله؛ چند لحظه دیگه امتحان کن."; }
    }
  });
} else {
  micBtn.disabled = true;
  micBtn.style.opacity = ".5";
  statusText.textContent = "تشخیص صدای فارسی در این مرورگر پشتیبانی نمی‌شود؛ تایپ همچنان فعاله.";
}
