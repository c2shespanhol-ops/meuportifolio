/*
  Alternância PT/EN.
  Os caminhos são relativos à pasta onde este arquivo está publicado, então o site funciona
  em qualquer nome de repositório ou domínio, sem "/meuportifolio/" fixo.
*/
(function () {
  "use strict";

  var script = document.currentScript || document.querySelector('script[src*="portfolio-language.js"]');
  var base = new URL(".", script && script.src ? script.src : location.href).pathname;

  /* Pares de páginas: [português, inglês], relativos à raiz do site. */
  var pairs = [
    ["index.html", "en/index.html"],
    ["case_study_01_persona_final.html", "en/cases/case-01-virtual-assistant.html"],
    ["case_study_02_leadtime_final.html", "en/cases/case-02-lead-time-governance.html"],
    ["case_study_03_habitat_final.html", "en/cases/case-03-habitat-saas.html"],
    ["case_study_04_shv_final.html", "en/cases/case-04-shv-energy.html"],
    ["case_study_05_pav_receita_federal_final.html", "en/cases/case-05-pav-receita-federal.html"],
    ["case_study_06_peixe_urbano_final.html", "en/cases/case-06-peixe-urbano.html"]
  ];
  var toEn = {}, toPt = {};
  pairs.forEach(function (p) { toEn[p[0]] = p[1]; toPt[p[1]] = p[0]; });

  function relativePath() {
    var p = location.pathname;
    var rel = p.indexOf(base) === 0 ? p.slice(base.length) : p.replace(/^\//, "");
    if (rel === "" || rel.slice(-1) === "/") rel += "index.html";
    return rel;
  }

  function init() {
    var rel = relativePath();
    var isEnglish = rel.indexOf("en/") === 0;
    var en = document.querySelectorAll('[data-lang="en"]');
    var pt = document.querySelectorAll('[data-lang="pt"]');

    var enHref = isEnglish ? rel : (toEn[rel] || "en/index.html");
    var ptHref = isEnglish ? (toPt[rel] || "index.html") : rel;

    en.forEach(function (a) {
      a.href = base + enHref;
      a.setAttribute("aria-current", isEnglish ? "page" : "false");
      a.classList.toggle("active", isEnglish);
    });
    pt.forEach(function (a) {
      a.href = base + ptHref;
      a.setAttribute("aria-current", isEnglish ? "false" : "page");
      a.classList.toggle("active", !isEnglish);
    });
    document.documentElement.lang = isEnglish ? "en" : "pt-BR";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
