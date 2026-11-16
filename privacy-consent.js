(function () {
  "use strict";
  var key = "portfolio-analytics-consent";\n  var scriptUrl = document.currentScript && document.currentScript.src;\n  var rootUrl = scriptUrl ? new URL(".", scriptUrl) : new URL("./", window.location.href);
  var english = (document.documentElement.lang || "pt-BR").toLowerCase().indexOf("en") === 0;
  var copy = english ? {
    title: "Your privacy matters",
    body: "With your permission, this site uses Google Analytics to understand visits and improve its content. Counter.dev is configured as a fallback provider. No analytics provider is loaded before you choose.",
    accept: "Accept", reject: "Reject", privacy: "Privacy policy"
  } : {
    title: "Sua privacidade importa",
    body: "Com sua autorização, este site usa o Google Analytics para entender as visitas e melhorar o conteúdo. O Counter.dev está configurado como provedor alternativo. Nenhum serviço de análise é carregado antes da sua escolha.",
    accept: "Aceitar", reject: "Rejeitar", privacy: "Política de privacidade"
  };
  var stored = null;
  try { stored = localStorage.getItem(key); } catch (error) { stored = null; }
  if (stored === "accepted" || stored === "rejected") return;
  var banner = document.createElement("section");
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
  function choose(value) {
    window.portfolioConsentChoice = value;\n    try { localStorage.setItem(key, value); } catch (error) { /* Session-only choice. */ }
    banner.remove();
    if (value === "accepted" && typeof window.portfolioLoadAnalytics === "function") window.portfolioLoadAnalytics();
  }
  var reject = document.createElement("button");
  reject.type = "button"; reject.className = "privacy-consent-reject"; reject.textContent = copy.reject;
  reject.addEventListener("click", function () { choose("rejected"); });
  var accept = document.createElement("button");
  accept.type = "button"; accept.className = "privacy-consent-accept"; accept.textContent = copy.accept;
  accept.addEventListener("click", function () { choose("accepted"); });
  actions.append(link, reject, accept);
  banner.append(content, actions);
  document.body.appendChild(banner);
})();
