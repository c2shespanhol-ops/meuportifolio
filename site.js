/* Comportamentos mínimos: botão de voltar ao topo e CTA fixo de contato no celular. */
(function () {
  "use strict";

  var toTop = document.querySelector(".to-top");
  var sticky = document.querySelector(".sticky-cta");
  if (!sticky && document.body) {
    var englishPage = (document.documentElement.lang || "pt-BR").toLowerCase().indexOf("en") === 0;
    sticky = document.createElement("a");
    sticky.className = "sticky-cta";
    sticky.href = englishPage
      ? "https://wa.me/5521986314378?text=Hello%2C%20Cleyton!%20I%27d%20like%20to%20talk%20about%20an%20opportunity.%20Can%20we%20talk%3F"
      : "https://wa.me/5521986314378?text=Ol%C3%A1%2C%20Cleyton!%20Gostaria%20de%20conversar%20sobre%20uma%20oportunidade.%20Podemos%20falar%3F";
    sticky.setAttribute("aria-label", englishPage ? "Chat on WhatsApp" : "Conversar no WhatsApp");
    sticky.title = englishPage ? "Chat on WhatsApp" : "Conversar no WhatsApp";
    sticky.target = "_blank";
    sticky.rel = "noopener noreferrer";
    sticky.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.2 1.6 6L0 24l6.3-1.7a11.8 11.8 0 0 0 5.8 1.5h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.2-3.5-8.5ZM12.1 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 1 1 8.3 4.6Zm5.4-7.3c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.2-.6l.5-.6.2-.5-.1-.5-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.1 3c.1.2 2 3.1 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z"/></svg>';
    document.body.appendChild(sticky);
  }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (sticky) document.body.classList.add("has-sticky");

  function onScroll() {
    if (toTop) {
      var topVisible = window.scrollY > 700;
      toTop.classList.toggle("show", topVisible);
      toTop.tabIndex = topVisible ? 0 : -1;
    }
    if (sticky) {
      var documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      var maxScroll = Math.max(0, documentHeight - window.innerHeight);
      var threshold = Math.min(documentHeight * 0.35, 600);
      var revealAt = maxScroll < threshold ? maxScroll : threshold;
      var stickyVisible = maxScroll === 0
        ? document.readyState === "complete"
        : window.scrollY >= revealAt;
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
  if (sticky) {
    window.addEventListener("load", onScroll, { once: true });
    if ("ResizeObserver" in window) {
      var layoutObserver = new ResizeObserver(onScroll);
      layoutObserver.observe(document.documentElement);
    }
  }
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
