/* ===========================
   Romantic Valentine Website
   For: Santibala 💗
   Mobile phone-frame + serial only

   UPDATE (Your request):
   ✅ ALWAYS start from LANDING when link opens / refresh / reopen
   ✅ Back/Forward (Safari iOS BFCache) also forces LANDING
   ✅ After 10 minutes idle, auto reset to LANDING
   ✅ No "resume where left off" anymore

   (Everything else kept same)
   =========================== */

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* Pages */
const pages = {
  landing: $("#page-landing"),
  hub: $("#page-hub"),
  gift1: $("#page-gift1"),
  gift2: $("#page-gift2"),
  gift3: $("#page-gift3"),
  final: $("#page-final"),
};
let currentPage = "landing";

function showPage(key){
  Object.values(pages).forEach(p => p?.classList.remove("is-active"));
  pages[key]?.classList.add("is-active");
  currentPage = key;

  window.scrollTo({ top: 0, behavior: "instant" });

  // Gift2 typing lifecycle
  if(key === "gift2"){
    startGift2Typing();
  }else{
    cancelGift2Typing();
  }

  // Gift3 direct open + mark unlocked
  if(key === "gift3"){
    openGift3Direct();
  }

  // Final vertical loop
  if(key === "final"){
    buildStrip();
    setTimeout(() => {
      // start AFTER layout settle
      startStripScroll();
    }, 120);
  }else{
    stopStripScroll();
  }
}

/* Storage */
const STORE_KEY = "santibala_valentine_frame_v4";
const defaultState = { started:false, gift1:false, gift2:false, gift3:false };

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return { ...defaultState };
    return { ...defaultState, ...JSON.parse(raw) };
  }catch{
    return { ...defaultState };
  }
}
function saveState(s){ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }
function resetState(){ localStorage.removeItem(STORE_KEY); }

/* ============ Force Fresh Start + 10 min timeout ============ */
const SESSION_KEY = "santibala_session_started_at";
const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

function fullResetToLanding(){
  // Clear saved progress so it never resumes
  resetState();

  // Stop animations that might be running
  stopStripScroll();
  cancelGift2Typing();

  // Reset UI bits (same as restart)
  if(btnNo){
    btnNo.style.position = "static";
    btnNo.style.left = "auto";
    btnNo.style.top = "auto";
  }
  if(btnYes) btnYes.style.transform = "scale(1)";
  noClicks = 0;

  if(askLine) askLine.textContent = "Will you be my Valentine,";
  if(askEmoji) askEmoji.textContent = "? 🥺💗";
  if(subLine) subLine.innerHTML =
    "I made this little world for you…<br/>(Tap gently, it’s full of cute surprises 🧸✨)";
  if(btnNo) btnNo.textContent = "No 😢";

  if(letterText) letterText.textContent = "";
  if(caret) caret.style.display = "none";
  if(gift2Next) gift2Next.disabled = true;

  memories?.classList.add("hidden");
  if(lockCard) lockCard.style.display = "none";

  renderHub();
  showPage("landing");
}

function markSessionStart(){
  // Store a timestamp for "this open"
  sessionStorage.setItem(SESSION_KEY, String(Date.now()));
}

function sessionExpired(){
  const t = Number(sessionStorage.getItem(SESSION_KEY) || "0");
  if(!t) return true;
  return (Date.now() - t) > SESSION_TIMEOUT_MS;
}

let sessionTimer = null;
function startSessionTimeoutWatcher(){
  if(sessionTimer) clearInterval(sessionTimer);

  // Check every 5 seconds; when expired, reset to landing
  sessionTimer = setInterval(() => {
    if(sessionExpired()){
      markSessionStart(); // reset timer baseline
      fullResetToLanding();
    }
  }, 5000);
}

// Refresh timer whenever user interacts (touch/click/scroll/keys)
function bumpSession(){
  sessionStorage.setItem(SESSION_KEY, String(Date.now()));
}
["pointerdown","click","keydown","scroll","touchstart"].forEach(ev => {
  window.addEventListener(ev, bumpSession, { passive:true });
});

// ✅ Safari/iOS back/forward cache fix (BFCache)
// When user returns using Back button, page may not reload, so boot() won't run.
// pageshow with persisted=true means restored from BFCache.
window.addEventListener("pageshow", (e) => {
  if(e.persisted){
    markSessionStart();
    fullResetToLanding();
  }
});

// ✅ If tab becomes visible again after long time, enforce timeout reset
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "visible" && sessionExpired()){
    markSessionStart();
    fullResetToLanding();
  }
});
/* ================================================================ */

/* Floating hearts */
const floatLayer = $("#floatLayer");
function spawnFloating(){
  const hearts = ["💗","💕","❤️","✨","🧿"];
  setInterval(() => {
    if(!floatLayer) return;
    const el = document.createElement("div");
    el.className = "float-heart";
    el.textContent = hearts[Math.floor(Math.random()*hearts.length)];
    el.style.left = (Math.random()*100) + "vw";
    el.style.fontSize = (14 + Math.random()*18) + "px";
    const dur = 6 + Math.random()*8;
    el.style.animationDuration = dur + "s";
    floatLayer.appendChild(el);
    setTimeout(() => el.remove(), dur*1000);
  }, 650);
}

/* Burst emojis */
const burstLayer = $("#burstLayer");
function burstEmoji(x, y, emoji){
  if(!burstLayer) return;
  const b = document.createElement("div");
  b.className = "burst";
  b.textContent = emoji;
  b.style.left = `${x}px`;
  b.style.top = `${y}px`;
  burstLayer.appendChild(b);
  setTimeout(() => b.remove(), 950);
}

/* Live emoji trail */
const trailLayer = $("#trailLayer");
let lastTrailAt = 0;
function spawnTrail(x, y){
  if(!trailLayer) return;
  const list = ["💗","✨","🫶","🥺","🌸","💕","🧿","😚"];
  const el = document.createElement("div");
  el.className = "trail";
  el.textContent = list[Math.floor(Math.random()*list.length)];
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  trailLayer.appendChild(el);
  setTimeout(() => el.remove(), 800);
}
window.addEventListener("pointermove", (e) => {
  const now = performance.now();
  if(now - lastTrailAt < 60) return;
  lastTrailAt = now;
  spawnTrail(e.clientX, e.clientY);
}, { passive:true });

/* Ripple */
function addRipple(el, ev){
  if(!el) return;
  el.classList.add("clicked");
  setTimeout(() => el.classList.remove("clicked"), 380);

  const r = el.getBoundingClientRect();
  const x = (ev?.clientX ?? (r.left + r.width/2)) - r.left;
  const y = (ev?.clientY ?? (r.top + r.height/2)) - r.top;

  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = ripple.style.height = `${Math.max(r.width, r.height)}px`;
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 580);
}

/* Modal */
const modal = $("#modal");
const modalBg = $("#modalBg");
const mTitle = $("#mTitle");
const mText = $("#mText");
const mPrimary = $("#mPrimary");
const mSecondary = $("#mSecondary");

let primaryFn = null;
let secondaryFn = null;

function openModal({title, text, primary="Okay 💗", secondary="Close 🙈", onPrimary=null, onSecondary=null, hideSecondary=false}){
  if(!modal) return;
  mTitle.textContent = title;
  mText.textContent = text;
  mPrimary.textContent = primary;
  mSecondary.textContent = secondary;
  mSecondary.style.display = hideSecondary ? "none" : "";
  primaryFn = onPrimary;
  secondaryFn = onSecondary;
  modal.classList.remove("hidden");
}
function closeModal(){
  if(!modal) return;
  modal.classList.add("hidden");
  primaryFn = null;
  secondaryFn = null;
  if(mSecondary) mSecondary.style.display = "";
}
modalBg?.addEventListener("click", closeModal);
mPrimary?.addEventListener("click", (e) => {
  addRipple(mPrimary, e);
  const fn = primaryFn;
  closeModal();
  if(typeof fn === "function") fn();
});
mSecondary?.addEventListener("click", (e) => {
  addRipple(mSecondary, e);
  const fn = secondaryFn;
  closeModal();
  if(typeof fn === "function") fn();
});

/* Landing flow */
const btnYes = $("#btnYes");
const btnNo = $("#btnNo");
const landingWrap = $("#landingBtnWrap");
const askLine = $("#askLine");
const askEmoji = $("#askEmoji");
const subLine = $("#subLine");
const heroSticker = $("#heroSticker");

function stickerPop(){
  if(!heroSticker) return;
  heroSticker.classList.remove("sticker-pop");
  void heroSticker.offsetWidth;
  heroSticker.classList.add("sticker-pop");
}

let noClicks = 0;
const noStages = [
  { ask:"Are you sure you want to say NO,", emoji:"? 🥺💗", sub:"My heart will cry… just a little 😭", no:"No 😢", pop:"🥺" },
  { ask:"Don’t be rude with me,", emoji:" 😼💗", sub:"I made it only for you… 😭💗", no:"No 😶", pop:"😼" },
  { ask:"Pleaseee Santibala,", emoji:"? 🥺", sub:"Say YES… I’m waiting 🧸💗", no:"Still No 🙃", pop:"🧸" },
  { ask:"Last chance my love,", emoji:"! 😳💞", sub:"If you say NO… I’ll chase you 😤💗", no:"NOOO 😤", pop:"😤" },
  { ask:"Okay… I’m sad now,", emoji:" 😭💔", sub:"But I still love you 🥺💗", no:"No 😭", pop:"💔" },
];

function moveNo(){
  if(!landingWrap || !btnNo) return;
  const w = landingWrap.getBoundingClientRect();
  const b = btnNo.getBoundingClientRect();

  landingWrap.style.position = "relative";
  btnNo.style.position = "absolute";

  const pad = 6;
  const maxX = Math.max(10, w.width - b.width - pad);
  const maxY = Math.max(10, 140);

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  btnNo.style.left = `${x}px`;
  btnNo.style.top = `${y}px`;

  burstEmoji(w.left + x + b.width/2, w.top + y + 10, "🙈");
}

function applyNoStage(){
  const stage = noStages[Math.min(noClicks, noStages.length-1)];
  if(askLine) askLine.textContent = stage.ask;
  if(askEmoji) askEmoji.textContent = stage.emoji;
  if(subLine) subLine.innerHTML = stage.sub;
  if(btnNo) btnNo.textContent = stage.no;

  if(btnYes){
    const scale = 1 + Math.min(noClicks * 0.08, 0.55);
    btnYes.style.transform = `scale(${scale.toFixed(2)})`;
  }

  stickerPop();
  const cx = window.innerWidth/2;
  const cy = window.innerHeight/3;
  burstEmoji(cx + (noClicks*10), cy + (noClicks*6), stage.pop);
}

btnNo?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  addRipple(btnNo, e);
  noClicks = Math.min(noClicks + 1, 30);
  applyNoStage();
  moveNo();
});

/* Hub elements */
const gift1 = $("#gift1");
const gift2 = $("#gift2");
const gift3 = $("#gift3");
const pill1 = $("#pill1");
const pill2 = $("#pill2");
const pill3 = $("#pill3");
const btnFinal = $("#btnFinal");

function renderHub(){
  const s = loadState();

  const g1Unlocked = s.started;
  const g2Unlocked = s.gift1;
  const g3Unlocked = s.gift2;
  const finalUnlocked = s.gift3;

  if(gift1) gift1.disabled = !g1Unlocked;
  if(gift2) gift2.disabled = !g2Unlocked;
  if(gift3) gift3.disabled = !g3Unlocked;

  if(pill1) pill1.textContent = s.gift1 ? "Opened ✅" : (g1Unlocked ? "Tap me 💗" : "Locked");
  if(pill2) pill2.textContent = s.gift2 ? "Opened ✅" : (g2Unlocked ? "Tap me 💌" : "Locked");
  if(pill3) pill3.textContent = s.gift3 ? "Opened ✅" : (g3Unlocked ? "Tap me 🧿" : "Locked");

  gift1?.classList.toggle("opened", s.gift1);
  gift2?.classList.toggle("opened", s.gift2);
  gift3?.classList.toggle("opened", s.gift3);

  if(btnFinal) btnFinal.disabled = !finalUnlocked;
}

/* YES flow */
btnYes?.addEventListener("click", (e) => {
  addRipple(btnYes, e);

  const s = loadState();
  s.started = true;
  saveState(s);

  const cx = window.innerWidth/2;
  const cy = window.innerHeight/3;
  ["💗","✨","🧸","💕","💞"].forEach((em, i) => {
    setTimeout(() => burstEmoji(cx + i*14, cy + i*8, em), i*120);
  });

  openModal({
    title: "Happy Valentine Day, My Love Santibala 💗",
    text: "Wait 3 seconds… I’m bringing your gifts 😚✨",
    primary: "Okay 😚",
    secondary: "Close",
    hideSecondary: true,
    onPrimary: () => {}
  });

  setTimeout(() => {
    closeModal();
    renderHub();
    showPage("hub");
  }, 3000);
});

/* Gift 1 Quiz */
const quizArea = $("#quizArea");
const gift1Next = $("#gift1Next");

const quiz = [
  {
    q:"Be honest… are you my girlfriend? 🥺💗",
    options:[
      { t:"No 😭", ok:false, msg:"HEY 😭💔 Try again!", em:"💔" },
      { t:"Yes 💗", ok:true, msg:"I knew ittt 🥺💗✨", em:"💗" }
    ]
  },
  {
    q:"If I miss you, what should I do? 🥺",
    options:[
      { t:"Forget it 🙃", ok:false, msg:"Never 🙈💔", em:"🙈" },
      { t:"Call you gently 💗", ok:true, msg:"Correct… my heart likes you 😌💗", em:"📞" }
    ]
  },
  {
    q:"Final lock… how long will you stay? 🧿❤️",
    options:[
      { t:"Till tomorrow 🙈", ok:false, msg:"Not enough 😭", em:"😭" },
      { t:"Forever 🧿❤️", ok:true, msg:"Yesss forever 😭🧿❤️", em:"🧿" }
    ]
  },
];

let qIndex = 0;

function renderQuestion(){
  const item = quiz[qIndex];
  if(!quizArea) return;

  quizArea.innerHTML = `
    <div class="qcard" id="qcard">
      <div class="q-title">${item.q}</div>
      <div class="opts" id="opts"></div>
      <div class="react" id="react"></div>
    </div>
  `;
  const opts = $("#opts");
  item.options.forEach(opt => {
    const b = document.createElement("button");
    b.className = "opt";
    b.type = "button";
    b.textContent = opt.t;
    b.addEventListener("click", (e) => answer(opt, e));
    opts.appendChild(b);
  });
}

function answer(opt, e){
  const card = $("#qcard");
  const react = $("#react");
  if(!card || !react) return;

  const r = card.getBoundingClientRect();
  const x = (e?.clientX ?? (r.left + r.width/2));
  const y = (e?.clientY ?? (r.top + r.height/2));

  burstEmoji(x, y, opt.em);
  setTimeout(() => burstEmoji(x+10, y-6, "💗"), 90);

  if(opt.ok){
    react.textContent = opt.msg;
    react.className = "react good";
    card.classList.remove("pulse"); void card.offsetWidth; card.classList.add("pulse");

    qIndex++;
    if(qIndex >= quiz.length){
      const s = loadState();
      s.gift1 = true;
      saveState(s);

      if(gift1Next){
        gift1Next.disabled = false;
        gift1Next.classList.add("pop");
        setTimeout(() => gift1Next.classList.remove("pop"), 500);
      }

      openModal({
        title: "Gift 1 opened ✅",
        text: "Good girl 😼💗 Now open Gift 2 💌",
        primary: "Open Gift 2 →",
        secondary: "Close",
        onPrimary: () => { showPage("gift2"); }
      });

      renderHub();
      return;
    }
    renderQuestion();
    return;
  }

  react.textContent = opt.msg;
  react.className = "react bad";
  card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
}

/* Gift 1 next */
gift1Next?.addEventListener("click", (e) => {
  addRipple(gift1Next, e);
  showPage("gift2");
});

/* Gift 2 Letter */
const letterText = $("#letterText");
const caret = $("#caret");
const gift2Next = $("#gift2Next");

const shortLetter = [
  "You make my world softer…",
  "You feel like home 🫶",
  "",
  "I choose you — always 🧿❤️",
  "",
].join("\n");

let typingSession = 0;
let typing = false;

function cancelGift2Typing(){
  typingSession++;
  typing = false;
  if(caret) caret.style.display = "none";
}

async function typeLetterOnce(){
  if(typing) return;
  typing = true;

  const mySession = ++typingSession;

  if(letterText) letterText.textContent = "";
  if(caret) caret.style.display = "inline-block";
  if(gift2Next) gift2Next.disabled = true;

  let i = 0;
  const speed = 22;

  while(i < shortLetter.length){
    if(mySession !== typingSession) return;
    if(letterText) letterText.textContent += shortLetter[i];
    i++;
    await new Promise(r => setTimeout(r, speed));
  }

  if(mySession !== typingSession) return;

  if(caret) caret.style.display = "none";
  typing = false;

  const s = loadState();
  s.gift2 = true;
  saveState(s);

  if(gift2Next){
    gift2Next.disabled = false;
    gift2Next.classList.add("pop");
    setTimeout(() => gift2Next.classList.remove("pop"), 500);
  }
  renderHub();
}

function startGift2Typing(){
  const s = loadState();
  if(s.gift2 && letterText && letterText.textContent.trim().length > 0){
    if(gift2Next) gift2Next.disabled = false;
    if(caret) caret.style.display = "none";
    return;
  }
  typeLetterOnce();
}

/* Gift 2 next */
gift2Next?.addEventListener("click", (e) => {
  addRipple(gift2Next, e);
  const s = loadState();
  if(!s.gift2){
    openModal({
      title: "Wait 😚",
      text: "Let the letter finish first 💌",
      primary: "Okay 💗",
      secondary: "Close"
    });
    return;
  }
  showPage("gift3");
});

/* Gift 3 DIRECT OPEN */
const memories = $("#memories");
const gift3Next = $("#gift3Next");
const lockCard = $("#lockCard");

function openGift3Direct(){
  if(lockCard) lockCard.style.display = "none";
  memories?.classList.remove("hidden");

  const s = loadState();
  if(!s.gift3){
    s.gift3 = true;
    saveState(s);
  }
  renderHub();

  const cx = window.innerWidth/2;
  const cy = window.innerHeight/2;
  ["💗","🧿","✨"].forEach((em, i) => setTimeout(() => burstEmoji(cx+i*10, cy-i*6, em), i*120));
}

/* Gift 3 to final */
gift3Next?.addEventListener("click", (e) => {
  addRipple(gift3Next, e);
  showPage("final");
});

/* Final button from hub */
btnFinal?.addEventListener("click", (e) => {
  addRipple(btnFinal, e);
  const s = loadState();
  if(!s.gift3){
    openModal({ title:"Hehe 😼", text:"Open all gifts first 🧸💌🧿" });
    return;
  }
  showPage("final");
});

/* Gift button clicks */
function clickFlashGift(btn){
  if(!btn) return;
  btn.classList.add("clicked");
  setTimeout(() => btn.classList.remove("clicked"), 420);
}
[gift1, gift2, gift3].forEach(g => {
  g?.addEventListener("click", (e) => {
    addRipple(g, e);
    clickFlashGift(g);

    const s = loadState();
    const n = Number(g.dataset.gift);

    if(n === 1 && !s.started){
      openModal({ title:"Hehe 🙈", text:"Say YES first, my love 😚💗" });
      return;
    }
    if(n === 2 && !s.gift1){
      openModal({ title:"Naughty 😼", text:"Open Gift 1 first… serial-wise 💗" });
      return;
    }
    if(n === 3 && !s.gift2){
      openModal({ title:"Almost 🥺💗", text:"Read Gift 2 first… then Gift 3 😚" });
      return;
    }

    if(n === 1){
      qIndex = 0;
      renderQuestion();
      if(gift1Next) gift1Next.disabled = !loadState().gift1;
      showPage("gift1");
    }
    if(n === 2) showPage("gift2");
    if(n === 3) showPage("gift3");
  });
});

/* ===========================
   FINAL: Vertical endless loop
   =========================== */
const strip = $("#strip");
const photos = [
  "assets/photos/p1.jpeg",
  "assets/photos/p2.jpeg",
  "assets/photos/p3.jpeg",
  "assets/photos/p4.jpeg",
  "assets/photos/p5.jpeg",
  "assets/photos/p6.jpeg",
];

/* Build strip with 2x photos (seamless) */
function buildStrip(){
  if(!strip) return;

  strip.innerHTML = "";
  const all = [...photos, ...photos];

  all.forEach((src) => {
    const wrap = document.createElement("div");
    wrap.className = "ph";

    const img = document.createElement("img");
    img.src = src;
    img.alt = "memory photo";
    img.loading = "lazy";
    img.addEventListener("click", () => openViewer(src));

    // when any image loads, recalc loopHeight
    img.addEventListener("load", () => {
      scheduleLoopRecalc();
    });

    wrap.appendChild(img);
    strip.appendChild(wrap);
  });

  scheduleLoopRecalc();
}

let raf = null;
let offset = 0;
let loopHeight = 0;
let recalcTimer = null;

/* Recalculate height of first half (because second half is clone) */
function recalcLoopHeight(){
  if(!strip) return 0;
  const cards = Array.from(strip.querySelectorAll(".ph"));
  if(cards.length < 2) return 0;

  const half = Math.floor(cards.length / 2);
  let h = 0;

  for(let i=0; i<half; i++){
    const rect = cards[i].getBoundingClientRect();
    h += rect.height;
  }

  // Add gaps (12px) between cards (half-1 gaps)
  const gap = 12;
  h += gap * Math.max(0, half - 1);

  loopHeight = h;
  return h;
}

/* throttle recalcs */
function scheduleLoopRecalc(){
  if(recalcTimer) clearTimeout(recalcTimer);
  recalcTimer = setTimeout(() => {
    recalcLoopHeight();
  }, 60);
}

function stopStripScroll(){
  if(raf) cancelAnimationFrame(raf);
  raf = null;
  offset = 0;
  if(strip) strip.style.transform = "translateY(0px)";
}

function startStripScroll(){
  if(!strip) return;
  if(raf) cancelAnimationFrame(raf);

  // ensure height computed
  if(loopHeight < 50) recalcLoopHeight();

  const speed = 0.55; // smooth (increase for faster)

  const step = () => {
    // keep measuring if still not ready
    if(loopHeight < 50) recalcLoopHeight();

    offset += speed;

    // when reach end of first-half height, reset to 0
    if(offset >= loopHeight) offset = 0;

    strip.style.transform = `translateY(${-offset}px)`;
    raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);
}

/* Love lines */
const loveLine = $("#loveLine");
const lines = [
  "You are my favorite feeling 💗",
  "With you… life feels softer 🥺✨",
  "If love had a name, it would be Santibala 💞",
  "You feel like home 🏡💗",
  "I choose you… always 🧿❤️"
];
let lineIndex = 0;
setInterval(() => {
  if(!loveLine) return;
  lineIndex = (lineIndex + 1) % lines.length;
  loveLine.textContent = lines[lineIndex];
}, 2200);

/* Restart */
const btnRestart = $("#btnRestart");
btnRestart?.addEventListener("click", (e) => {
  addRipple(btnRestart, e);
  markSessionStart();        // restart timer baseline
  fullResetToLanding();      // hard reset
});

/* Viewer */
const viewer = $("#viewer");
const viewerBg = $("#viewerBg");
const viewerImg = $("#viewerImg");
const viewerClose = $("#viewerClose");

function openViewer(src){
  if(!viewer || !viewerImg) return;
  viewerImg.src = src;
  viewer.classList.remove("hidden");
}
function closeViewer(){
  if(!viewer || !viewerImg) return;
  viewer.classList.add("hidden");
  viewerImg.src = "";
}
viewerBg?.addEventListener("click", closeViewer);
viewerClose?.addEventListener("click", (e) => { addRipple(viewerClose, e); closeViewer(); });

/* Boot */
function boot(){
  spawnFloating();

  // ✅ ALWAYS start fresh at landing on open/refresh
  markSessionStart();
  fullResetToLanding();

  // ✅ Auto reset after 10 minutes idle
  startSessionTimeoutWatcher();
}

boot();
