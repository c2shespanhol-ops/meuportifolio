(function () {
  "use strict";
  var consentKey = "portfolio-analytics-consent";
  var alreadyLoaded = false;
  function hasConsent() {
    try { return window.localStorage.getItem(consentKey) === "accepted" || window.portfolioConsentChoice === "accepted"; }
    catch (error) { return false; }
  }
  function loadAnalytics() {
    if (alreadyLoaded || !hasConsent()) return;
    alreadyLoaded = true;
    var provider = window.PORTFOLIO_ANALYTICS_PROVIDER;
    var ga4Id = window.PORTFOLIO_GA4_MEASUREMENT_ID;
    var counterId = window.PORTFOLIO_COUNTER_ID;
    if (ga4Id) window["ga-disable-" + ga4Id] = false;
    if (provider === "ga4" && ga4Id) {
      var gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga4Id);
      document.head.appendChild(gaScript);
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", ga4Id, { anonymize_ip: true, transport_type: "beacon" });
      return;
    }
    if (counterId) {
      var counterScript = document.createElement("script");
      counterScript.src = "https://cdn.counter.dev/script.js";
      counterScript.dataset.id = counterId;
      counterScript.dataset.utcoffset = "-3";
      counterScript.async = true;
      document.head.appendChild(counterScript);
    }
  }
  window.portfolioLoadAnalytics = loadAnalytics;
  window.portfolioRevokeAnalytics = function () {
    alreadyLoaded = false;
    var ga4Id = window.PORTFOLIO_GA4_MEASUREMENT_ID;
    if (ga4Id) window["ga-disable-" + ga4Id] = true;
  };
  if (hasConsent()) loadAnalytics();
})();
