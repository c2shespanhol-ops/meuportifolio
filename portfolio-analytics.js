(function () {
  "use strict";

  /*
   * Portfolio analytics.
   * Primary provider: Google Analytics 4.
   * Fallback provider: Counter.dev.
   *
   * GA4 requires only the public Measurement ID in the frontend.
   * Private reporting credentials stay exclusively in Career OS.
   */

  var provider = window.PORTFOLIO_ANALYTICS_PROVIDER;
  var ga4Id = window.PORTFOLIO_GA4_MEASUREMENT_ID;
  var counterId = window.PORTFOLIO_COUNTER_ID;

  if (provider === "ga4" && ga4Id) {
    var gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga4Id);
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", ga4Id, {
      anonymize_ip: true,
      transport_type: "beacon"
    });
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
})();
