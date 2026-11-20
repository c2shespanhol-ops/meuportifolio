/* Comportamentos mínimos: botão de voltar ao topo e CTA fixo de contato no celular. */
(function () {
  "use strict";

  var toTop = document.querySelector(".to-top");
  var sticky = document.querySelector(".sticky-cta");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (sticky) document.body.classList.add("has-sticky");

  function onScroll() {
    if (toTop) {
      var topVisible = window.scrollY > 700;
      toTop.classList.toggle("show", topVisible);
      toTop.tabIndex = topVisible ? 0 : -1;
    }
    if (sticky) {
      var documentHeight = document.documentElement.scrollHeight;
      var maxScroll = Math.max(0, documentHeight - window.innerHeight);
      var threshold = Math.min(documentHeight * 0.35, 600);
      var revealAt = maxScroll < threshold ? maxScroll : threshold;
      var stickyVisible = maxScroll === 0 || window.scrollY >= revealAt;
      sticky.classList.toggle("show", stickyVisible);
      sticky.tabIndex = stickyVisible ? 0 : -1;
      sticky.setAttribute("aria-hidden", stickyVisible ? "false" : "true");
    }
  }
  if (toTop) {
    toTop.tabIndex = -1;
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      var skip = document.querySelector(".skip");
      if (skip) skip.focus({ preventScroll: true });
    });
  }
  if (sticky) {
    sticky.tabIndex = -1;
    sticky.setAttribute("aria-hidden", "true");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* O atalho do WhatsApp aparece após o visitante avançar pela página. */
})();

/* Carrossel de cases com filtro por empresa. Sem JS, a faixa continua rolável com snap. */
(function () {
  "use strict";
  var root = document.querySelector("[data-carousel]");
  if (!root) return;
  var track = root.querySelector(".car-track");
  var prev = root.querySelector(".car-btn.prev");
  var next = root.querySelector(".car-btn.next");
  var count = root.querySelector(".car-count");
  var dotsBox = root.querySelector(".car-dots");
  var info = root.querySelector(".carousel-info");
  var chips = root.querySelectorAll(".chip");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cards = Array.prototype.slice.call(track.querySelectorAll(".case"));
  var dots = [];
  document.documentElement.classList.add("js-carousel");

  function visible() { return cards.filter(function (c) { return !c.hidden; }); }
  function step() { var v = visible(); return v.length > 1 ? v[1].offsetLeft - v[0].offsetLeft : track.clientWidth; }
  function current() {
    var v = visible(); if (!v.length) return 0;
    var pos = track.scrollLeft, best = 0, d = Infinity;
    v.forEach(function (c, i) { var x = Math.abs(c.offsetLeft - track.offsetLeft - pos); if (x < d) { d = x; best = i; } });
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = v.length - 1;
    return best;
  }
  function goTo(i) {
    var v = visible(); if (!v[i]) return;
    track.scrollTo({ left: v[i].offsetLeft - track.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  }
  function buildDots() {
    dotsBox.innerHTML = ""; dots = [];
    visible().forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", root.dataset.dots.replace("{i}", i + 1));
      b.addEventListener("click", function () { goTo(i); });
      dotsBox.appendChild(b); dots.push(b);
    });
  }
  function update() {
    var v = visible(), i = current();
    count.textContent = root.dataset.counter.replace("{i}", v.length ? i + 1 : 0).replace("{n}", v.length);
    dots.forEach(function (d, k) { if (k === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
    prev.disabled = i <= 0;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  }
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.dataset.filter;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      cards.forEach(function (c) { c.hidden = !(f === "all" || c.dataset.company === f); });
      info.textContent = f === "all" ? root.dataset.allinfo : (root.getAttribute("data-info-" + f) || "");
      track.scrollTo({ left: 0, behavior: "auto" }); buildDots(); update();
    });
  });
  prev.addEventListener("click", function () { goTo(Math.max(0, current() - 1)); });
  next.addEventListener("click", function () { goTo(Math.min(visible().length - 1, current() + 1)); });
  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(Math.min(visible().length - 1, current() + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(Math.max(0, current() - 1)); }
  });
  var t; track.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(update, 60); }, { passive: true });
  window.addEventListener("resize", update);
  buildDots(); update();
})();

/* Progresso de leitura nos cases e marca de "visto" nos cards (armazenamento opcional, nunca obrigatório). */
(function () {
  "use strict";
  var KEY = "pf-visited";
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  var file = location.pathname.split("/").pop();
  if (document.querySelector(".case-wrap")) {
    var bar = document.createElement("div");
    bar.className = "read-progress"; bar.setAttribute("aria-hidden", "true");
    bar.innerHTML = "<span></span>"; document.body.appendChild(bar);
    var fill = bar.firstChild, ticking = false;
    var upd = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + "%"; ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
    var seen = read(); if (seen.indexOf(file) < 0) { seen.push(file); write(seen); }
  } else {
    var done = read();
    document.querySelectorAll("a.case").forEach(function (a) {
      if (done.indexOf((a.getAttribute("href") || "").split("/").pop()) >= 0) a.classList.add("visited");
    });
  }
})();
