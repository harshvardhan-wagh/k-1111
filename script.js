/* =========================================================
   1. GOOGLE SHEET LOGGING
   Paste your Apps Script Web App URL below (ends with /exec)
   ========================================================= */
const LOG_URL = "https://script.google.com/macros/s/AKfycby9NxOO4I9aFQ6gM8PivbtS88ZRhHOwRDsqhOLdFk4ZAOKsRI4SdoFqWv4ZwWyvvY8N/exec";

const SESSION = Math.random().toString(36).slice(2, 8); // one id per visit

function logEvent(event, page, details = "") {
  if (!LOG_URL.startsWith("https://")) return; // logging off until URL is added
  try {
    fetch(LOG_URL, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        event, page, details,
        session: SESSION,
        device: navigator.userAgent
      })
    });
  } catch (e) { /* never break the site because of logging */ }
}

/* =========================================================
   2. PAGE SWITCHING
   ========================================================= */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.toggle("active", p.id === id);
  });
  window.scrollTo(0, 0);
  logEvent("page_view", id);
  if (id !== "opening" && id !== "answer") Fireworks.stop();
  if (id === "journey") Journey.start();
  if (id === "promises") Promises.start();
  if (id === "our_future") OurFuture.start();
  if (id === "question") Question.start();
}

/* =========================================================
   3. STARS
   ========================================================= */
function makeStars(count = 26) {
  const sky = document.querySelector(".sky");
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.className = "star";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
    const size = 2 + Math.random() * 4;
    s.style.width = s.style.height = size + "px";
    sky.appendChild(s);
  }
}

/* =========================================================
   4. DIWALI FIREWORKS (canvas behind everything)
   ========================================================= */
const Fireworks = (() => {
  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#E0A526", "#D4566E", "#3E8E5A", "#8E6BC9", "#E07A2E", "#C7A15A"];
  const GRAVITY = 0.06;
  let W, H, rockets = [], sparks = [], timer = null, running = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function launch() {
    const x = W * (0.1 + Math.random() * 0.8);
    const peakY = H * (0.06 + Math.random() * 0.2);   // burst near the top, above her photo
    rockets.push({
      x, y: H + 10,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -Math.sqrt(2 * GRAVITY * (H + 10 - peakY)),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      trail: []
    });
  }

  function burst(r) {
    const n = 46 + Math.floor(Math.random() * 20);
    const second = COLORS[Math.floor(Math.random() * COLORS.length)];
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
      const s = 1.4 + Math.random() * 2.4;
      const life = 55 + Math.random() * 35;
      sparks.push({
        x: r.x, y: r.y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life, max: life,
        color: i % 3 === 0 ? second : r.color
      });
    }
  }

  function frame() {
    if (!running && !rockets.length && !sparks.length) { ctx.clearRect(0, 0, W, H); return; }
    ctx.clearRect(0, 0, W, H);

    rockets = rockets.filter(r => {
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 8) r.trail.shift();
      r.x += r.vx; r.y += r.vy; r.vy += GRAVITY;
      ctx.strokeStyle = "rgba(199,161,90,.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      r.trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.stroke();
      if (r.vy >= -0.4) { burst(r); return false; }
      return true;
    });

    sparks = sparks.filter(s => {
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.97; s.vy = s.vy * 0.97 + 0.035;
      s.life--;
      ctx.globalAlpha = Math.sqrt(Math.max(s.life / s.max, 0));
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return s.life > 0;
    });

    requestAnimationFrame(frame);
  }

  function schedule() {
    if (!running) return;
    if (!document.hidden) launch();
    timer = setTimeout(schedule, 1600 + Math.random() * 1800);
  }

  return {
    start() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (running) return;
      running = true;
      resize();
      window.addEventListener("resize", resize);
      setTimeout(schedule, 2500);   // first rocket after the opening sequence begins
      requestAnimationFrame(frame);
    },
    celebrate(count = 6) {          // a burst of many rockets at once
      if (!running) return;
      for (let i = 0; i < count; i++) setTimeout(launch, i * 220);
    },
    stop() { running = false; clearTimeout(timer); }
  };
})();

/* =========================================================
   5. PAGE 2: THE GROWING VINE
   ========================================================= */
const Journey = (() => {
  const box = document.getElementById("journeyPath");
  const svg = box.querySelector(".vine");
  const track = box.querySelector(".vine-track");
  const grow = box.querySelector(".vine-grow");
  const stops = [...box.querySelectorAll(".stop")];
  const bloom = document.getElementById("bloom");
  let samples = [], total = 0, leaves = [], started = false;

  const vineX = y => 30 + 8 * Math.sin(y / 85);

  function build() {
    const h = box.offsetHeight;
    svg.setAttribute("viewBox", `0 0 64 ${h}`);
    samples = []; total = 0;
    let d = "", px = vineX(0), py = 0;
    for (let y = 0; y <= h; y += 8) {
      const x = vineX(y);
      if (y) total += Math.hypot(x - px, y - py);
      samples.push({ y, len: total });
      d += (y ? " L" : "M") + x.toFixed(1) + " " + y;
      px = x; py = y;
    }
    track.setAttribute("d", d);
    grow.setAttribute("d", d);
    grow.style.strokeDasharray = total;

    // a pair of leaves at each chapter, plus small ones in between
    leaves.forEach(l => l.el.remove());
    leaves = [];
    stops.forEach((s, i) => {
      const y = s.offsetTop + 40;
      addLeaf(y, "right"); addLeaf(y + 14, "left");
      addLeaf(y + s.offsetHeight * 0.55, i % 2 ? "right" : "left");
    });
    update();
  }

  function addLeaf(y, side) {
    const el = document.createElement("span");
    el.className = "leaf " + side;
    const x = vineX(y);
    el.style.top = (y - 7) + "px";
    el.style.left = side === "right" ? (x + 1) + "px" : (x - 27) + "px";
    box.appendChild(el);
    leaves.push({ el, y });
  }

  function update() {
    const top = box.getBoundingClientRect().top;
    const reach = window.innerHeight * 0.72 - top;           // how far down the vine has grown
    const s = samples.find(p => p.y >= reach) || samples[samples.length - 1];
    const len = reach <= 0 ? 0 : s.len;
    grow.style.strokeDashoffset = total - len;
    leaves.forEach(l => l.el.classList.toggle("grown", l.y < reach));
  }

  function drawGerbera() {
    bloom.querySelector(".gerbera").innerHTML = gerberaSVG();
  }

  function start() {
    if (started) { build(); return; }
    started = true;
    drawGerbera();

    const seen = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add("seen");
        logEvent("chapter_seen", "journey", e.target.dataset.stop);
        seen.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    stops.forEach(s => seen.observe(s));

    const bloomObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        bloom.classList.add("open");
        if (navigator.vibrate) navigator.vibrate(60);
        logEvent("chapter_seen", "journey", "bloom");
        bloomObs.disconnect();
      }
    }, { threshold: 0.35 });
    bloomObs.observe(bloom);

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", build);
    // rebuild once photos have loaded and the page height is final
    box.querySelectorAll("img").forEach(img => img.complete || img.addEventListener("load", build, { once: true }));
    requestAnimationFrame(build);

    document.getElementById("toFutureBtn").addEventListener("click", () => {
      logEvent("click", "journey", "Now see what's ahead");
      showPage("future");
    });
  }

  return { start };
})();

/* =========================================================
   6. PAGE 3: THE LETTER
   ========================================================= */
function gerberaSVG(outer = "#D92B3E", inner = "#B81E33", mid = "#7A1426", core = "#2B1410") {
  let out = "";
  for (let i = 0; i < 24; i++) out += `<ellipse cx="0" cy="-56" rx="10" ry="38" fill="${outer}" transform="rotate(${i * 15})"/>`;
  for (let i = 0; i < 20; i++) out += `<ellipse cx="0" cy="-36" rx="7" ry="24" fill="${inner}" transform="rotate(${i * 18 + 9})"/>`;
  return out + `<circle r="20" fill="${mid}"/><circle r="11" fill="${core}"/>`;
}

const Letter = (() => {
  const env = document.getElementById("envelope");
  const letter = document.getElementById("letter");
  let opened = false;

  env.querySelector(".seal svg").innerHTML = gerberaSVG("#E4596A", "#C93A4C", "#8E1828", "#5C0F1A");

  function open(instant = false) {
    if (opened) return;
    opened = true;
    env.classList.add("open");
    document.getElementById("tapHint").hidden = true;
    if (navigator.vibrate && !instant) navigator.vibrate(40);
    logEvent("letter_opened", "future", instant ? "via #letter link" : "tapped envelope");
    setTimeout(() => {
      env.hidden = true;
      letter.classList.add("show");
      document.getElementById("afterLetter").classList.add("show");
    }, instant ? 0 : 950);
  }

  env.addEventListener("click", () => open());
  document.getElementById("toPromisesBtn").addEventListener("click", () => {
    logEvent("click", "future", "Read my promises");
    showPage("promises");
  });

  return { open };
})();

/* =========================================================
   7. PAGE 4: PROMISES, one at a time
   ========================================================= */
const Promises = (() => {
  const list = [
    "I will always support you. Your career, your dreams, your adventures.",
    "I will always be loyal. I would rather die than ever cheat on you.",
    "I will never come between you and your family. Your family will always be my family too.",
    "Even on our worst days, I will never disrespect you.",
    "When your mind won’t stop overthinking, I’ll just listen. No lectures, just me, holding your hand.",
    "I will take care of you the way you have always taken care of everyone else.",
    "I will never stop your rides. I’ll be on the road right behind you. 🏍️",
    "Biryani on your bad days, waffles on your good ones."
  ];
  const stage = document.getElementById("promiseStage");
  const count = document.getElementById("promiseCount");
  const btn = document.getElementById("nextPromiseBtn");
  let i = -1, started = false;

  function next() {
    if (i >= list.length - 1) return finish();
    i++;
    const last = i === list.length - 1;
    stage.innerHTML = `<p class="promise${last ? " last" : ""}">${list[i]}</p>`;
    count.textContent = `${i + 1} of ${list.length}`;
    btn.textContent = last ? "Read them all together" : "Next promise";
    logEvent("promise_seen", "promises", String(i + 1));
  }

  function finish() {
    stage.hidden = true; btn.hidden = true; count.hidden = true;
    document.getElementById("promiseList").innerHTML = list.map(p => `<li>${p}</li>`).join("");
    document.getElementById("allPromises").classList.add("show");
    window.scrollTo(0, 0);
  }

  function start() {
    if (started) return;
    started = true;
    btn.addEventListener("click", next);
    stage.addEventListener("click", next);
    document.getElementById("toOurFutureBtn").addEventListener("click", () => {
      logEvent("click", "promises", "See our future");
      showPage("our_future");
    });
    next();
  }
  return { start };
})();

/* =========================================================
   8. PAGE 5: OUR FUTURE, the year ticks forward
   ========================================================= */
const OurFuture = (() => {
  const page = document.getElementById("our_future");
  const stages = [...page.querySelectorAll(".life-stage")];
  const yearNum = document.getElementById("yearNum");
  const yearLabel = document.getElementById("yearLabel");
  const end = document.getElementById("lifeEnd");
  let shownYear = 2026, anim = null, started = false, current = -1;

  // background warms from soft green to golden sunset as the years pass
  const from = [238, 246, 239], to = [250, 214, 170];
  function warm(t) {
    const c = from.map((v, i) => Math.round(v + (to[i] - v) * t));
    page.style.setProperty("--life-bg", `rgb(${c.join(",")})`);
    // year gets a deeper amber so it stays readable on the sunset colour
    const g = [199, 161, 90], a = [160, 98, 30];
    page.style.setProperty("--year-color", `rgb(${g.map((v, i) => Math.round(v + (a[i] - v) * t)).join(",")})`);
  }

  function countTo(target) {
    cancelAnimationFrame(anim);
    const start = shownYear, t0 = performance.now(), dur = 700;
    const step = now => {
      const k = Math.min((now - t0) / dur, 1);
      shownYear = Math.round(start + (target - start) * (1 - Math.pow(1 - k, 3)));
      yearNum.textContent = shownYear;
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function activate(i) {
    if (i === current) return;
    current = i;
    const s = stages[i];
    countTo(+s.dataset.year);
    yearLabel.textContent = s.dataset.label === String(s.dataset.year) ? s.querySelector("h3").textContent : s.dataset.label;
    warm(i / (stages.length - 1));
    if (navigator.vibrate) navigator.vibrate(15);
  }

  function start() {
    if (started) return;
    started = true;

    // fade each photo in once
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add("seen");
        reveal.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    stages.forEach(s => reveal.observe(s));

    // the stage in the middle of the screen sets the year
    const middle = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const i = stages.indexOf(e.target);
        activate(i);
        logEvent("future_seen", "our_future", e.target.dataset.stop);
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    stages.forEach(s => middle.observe(s));

    const endObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { end.classList.add("seen"); endObs.disconnect(); }
    }, { threshold: 0.4 });
    endObs.observe(end);

    document.getElementById("toQuestionBtn").addEventListener("click", () => {
      logEvent("click", "our_future", "I have one question for you");
      showPage("question");
    });
  }
  return { start };
})();

/* =========================================================
   9. PAGE 6: THE QUESTION AND HER ANSWER
   ========================================================= */
const Question = (() => {
  let started = false;

  function rainPetals(n = 40) {
    const box = document.getElementById("petals");
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "petal";
      p.style.left = Math.random() * 100 + "%";
      p.style.setProperty("--drift", (Math.random() * 120 - 60) + "px");
      p.style.setProperty("--spin", (Math.random() * 720 - 360) + "deg");
      p.style.animationDuration = (4 + Math.random() * 4) + "s";
      p.style.animationDelay = (Math.random() * 3) + "s";
      box.appendChild(p);
    }
  }

  function answer(isYes) {
    logEvent("ANSWER", "question", isYes ? "YES ❤️" : "NO");
    document.getElementById("replyYes").hidden = !isYes;
    document.getElementById("replyNo").hidden = isYes;
    showPage("answer");
    if (isYes) {
      if (navigator.vibrate) navigator.vibrate([80, 60, 80, 60, 250]);
      Fireworks.start();
      Fireworks.celebrate(10);
      rainPetals();
    }
  }

  function start() {
    if (started) return;
    started = true;
    document.querySelector(".ask-flower").innerHTML = gerberaSVG();
    document.getElementById("yesBtn").addEventListener("click", () => answer(true));
    document.getElementById("noBtn").addEventListener("click", () => answer(false));
    document.querySelectorAll("[data-next]").forEach(b => b.addEventListener("click", () => {
      logEvent("click", "answer", "One last thing");
      showPage("final");
    }));
    document.getElementById("rereadLetter").addEventListener("click", e => {
      e.preventDefault();
      history.replaceState(null, "", "#letter");
      showPage("future");
      Letter.open(true);
    });
  }
  return { start };
})();

/* =========================================================
   10. PAGE 1: OPENING
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  makeStars();

  // Her own link to the letter: .../#letter opens it directly
  if (location.hash === "#letter") {
    showPage("future");
    Letter.open(true);
    return;
  }

  Fireworks.start();
  logEvent("site_opened", "opening");

  const overlay = document.getElementById("wishOverlay");
  document.getElementById("wishBtn").addEventListener("click", () => {
    logEvent("click", "opening", "Make a wish");

    // gentle buzz on her phone (works on Android / Samsung)
    if (navigator.vibrate) navigator.vibrate([40, 60, 120]);

    // a burst of Diwali rockets for her wish
    Fireworks.celebrate(7);

    // a shooting star crosses the sky when she makes her wish
    const star = document.getElementById("shootingStar");
    star.classList.remove("now"); void star.offsetWidth; star.classList.add("now");

    setTimeout(() => overlay.classList.add("show"), 2200);
    setTimeout(() => {
      Fireworks.stop();
      showPage("journey");
      overlay.classList.remove("show");
    }, 5000);
  });
});
