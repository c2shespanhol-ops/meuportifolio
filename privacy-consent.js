(function () {
  "use strict";
  var key = "portfolio-analytics-consent";
  var consentScript = document.currentScript;
  var policyHref = consentScript && consentScript.getAttribute("data-privacy-href");
  var english = (document.documentElement.lang || "pt-BR").toLowerCase().indexOf("en") === 0;
  function ensureWhatsAppShortcut() {
    var sticky = document.querySelector(".sticky-cta");
    if (!sticky) {
      sticky = document.createElement("a");
      sticky.className = "sticky-cta";
      sticky.href = english
        ? "https://wa.me/5521986314378?text=Hello%2C%20Cleyton!%20I%27d%20like%20to%20talk%20about%20an%20opportunity.%20Can%20we%20talk%3F"
        : "https://wa.me/5521986314378?text=Ol%C3%A1%2C%20Cleyton!%20Gostaria%20de%20conversar%20sobre%20uma%20oportunidade.%20Podemos%20falar%3F";
      sticky.setAttribute("aria-label", english ? "Chat on WhatsApp" : "Conversar no WhatsApp");
      sticky.title = english ? "Chat on WhatsApp" : "Conversar no WhatsApp";
      sticky.target = "_blank";
      sticky.rel = "noopener noreferrer";
      sticky.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.2 1.6 6L0 24l6.3-1.7a11.8 11.8 0 0 0 5.8 1.5h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.2-3.5-8.5ZM12.1 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 1 1 8.3 4.6Zm5.4-7.3c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.2-.6l.5-.6.2-.5-.1-.5-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.1 3c.1.2 2 3.1 4.8 4.3.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z"/></svg>';
      document.body.appendChild(sticky);
    }
    document.body.classList.add("has-sticky");
    sticky.tabIndex = -1;
    sticky.setAttribute("aria-hidden", "true");

    function updateVisibility() {
      var documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      var maxScroll = Math.max(0, documentHeight - window.innerHeight);
      var threshold = Math.min(documentHeight * 0.35, 600);
      var revealAt = maxScroll < threshold ? maxScroll : threshold;
      var visible = maxScroll === 0
        ? document.readyState === "complete"
        : window.scrollY >= revealAt;
      sticky.classList.toggle("show", visible);
      sticky.tabIndex = visible ? 0 : -1;
      sticky.setAttribute("aria-hidden", visible ? "false" : "true");
    }

    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    window.addEventListener("load", updateVisibility, { once: true });
    if (typeof ResizeObserver === "function") {
      var layoutObserver = new ResizeObserver(updateVisibility);
      layoutObserver.observe(document.documentElement);
    }
    updateVisibility();
  }
  ensureWhatsAppShortcut();

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
  function revokeAnalytics() {
    var measurementId = window.PORTFOLIO_GA4_MEASUREMENT_ID;
    if (measurementId) window["ga-disable-" + measurementId] = true;
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
      window.gtag("set", "send_page_view", false);
    }
    // Remove the already-authorized GA loader without unloading the document.
    // Reloading would flush pending beacon events (for example, enhanced-measurement scroll).
    document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').forEach(function (script) {
      script.remove();
    });
    document.querySelectorAll('script[src*="counter.dev"]').forEach(function (script) {
      script.remove();
    });
    if (typeof window.portfolioRevokeAnalytics === "function") window.portfolioRevokeAnalytics();
  }

  function choose(value) {
    var previous = readChoice();
    window.portfolioConsentChoice = value;
    try { window.localStorage.setItem(key, value); }
    catch (error) { /* Keep the choice active for this page when storage is unavailable. */ }
    if (value === "rejected") revokeAnalytics();
    hideBanner();
    if (value === "accepted" && typeof window.portfolioLoadAnalytics === "function") {
      window.portfolioLoadAnalytics();
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
    link.href = new URL(policyHref || (english ? "../privacy.html" : "../privacidade.html"), window.location.href).href;
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
