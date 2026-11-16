(function () {
  "use strict";
  var key = "portfolio-analytics-consent";
  var scriptUrl = document.currentScript && document.currentScript.src;
  var rootUrl = scriptUrl ? new URL(".", scriptUrl) : new URL("./", window.location.href);
  var english = (document.documentElement.lang || "pt-BR").toLowerCase().indexOf("en") === 0;
  var copy = english ? {
    title: "Your privacy matters",
    body: "With your permission, this site uses Google Analytics to understand visits and improve its content. Counter.dev may be used as an alternative analytics provider. No analytics provider is loaded before you choose.",
    accept: "Accept", reject: "Reject", privacy: "Privacy"
  } : {
    title: "Sua privacidade importa",
    body: "Com sua autorização, este site usa o Google Analytics para entender as visitas e melhorar o conteúdo. O Counter.dev pode ser utilizado como provedor alternativo de métricas. Nenhum serviço de análise é carregado antes da sua escolha.",
    accept: "Aceitar", reject: "Rejeitar", privacy: "Privacidade"
  };
  var banner = null;
  var resizeObserver = null;

  function readChoice() {
    try { return window.localStorage.getItem(key); }
    catch (error) { return window.portfolioConsentChoice || null; }
  }
  function updateFloatingControls() {
    if (!banner || !banner.isConnected) return;
    var height = Math.ceil(banner.getBoundingClientRect().height);
    document.body.style.setProperty("--privacy-consent-height", height + "px");
  }
  function hideBanner() {
    if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
    if (banner) { banner.remove(); banner = null; }
    document.body.classList.remove("privacy-consent-visible");
    document.body.style.removeProperty("--privacy-consent-height");
    window.removeEventListener("resize", updateFloatingControls);
  }
  function choose(value) {
    var previous = readChoice();
    window.portfolioConsentChoice = value;
    try { window.localStorage.setItem(key, value); }
    catch (error) { /* Keep the choice active for this page when storage is unavailable. */ }
    hideBanner();
    if (value === "accepted" && typeof window.portfolioLoadAnalytics === "function") {
      window.portfolioLoadAnalytics();
    } else if (value === "rejected" && previous === "accepted") {
      window.location.reload();
    }
  }
  function showBanner() {
    if (banner && banner.isConnected) { updateFloatingControls(); return; }
    banner = document.createElement("section");
    banner.className = "privacy-consent";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", copy.title);
    banner.setAttribute("aria-describedby", "privacy-consent-description");
    var content = document.createElement("div");
    content.className = "privacy-consent-copy";
    var heading = document.createElement("h2");
    heading.textContent = copy.title;
    var description = document.createElement("p");
    description.id = "privacy-consent-description";
    description.textContent = copy.body;
    content.append(heading, description);
    var actions = document.createElement("div");
    actions.className = "privacy-consent-actions";
    var link = document.createElement("a");
    link.className = "privacy-consent-link";
    link.href = new URL(english ? "en/privacy.html" : "privacidade.html", rootUrl).href;
    link.textContent = copy.privacy;
    var reject = document.createElement("button");
    reject.type = "button";
    reject.className = "privacy-consent-reject";
    reject.textContent = copy.reject;
    reject.addEventListener("click", function () { choose("rejected"); });
    var accept = document.createElement("button");
    accept.type = "button";
    accept.className = "privacy-consent-accept";
    accept.textContent = copy.accept;
    accept.addEventListener("click", function () { choose("accepted"); });
    actions.append(link, reject, accept);
    banner.append(content, actions);
    document.body.appendChild(banner);
    document.body.classList.add("privacy-consent-visible");
    updateFloatingControls();
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(updateFloatingControls);
      resizeObserver.observe(banner);
    }
    window.addEventListener("resize", updateFloatingControls);
  }

  window.portfolioOpenPrivacyPreferences = showBanner;
  document.querySelectorAll(".privacy-preferences-link").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      showBanner();
      var firstButton = banner && banner.querySelector("button");
      if (firstButton) firstButton.focus();
    });
  });
  var stored = readChoice();
  if (stored !== "accepted" && stored !== "rejected") showBanner();
})();
