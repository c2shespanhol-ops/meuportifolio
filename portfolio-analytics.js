(function () {
  "use strict";

  /*
   * Portfolio analytics for GitHub Pages.
   * Provider: Counter.dev
   *
   * Activation:
   * 1. Create a Counter account and add the portfolio domain.
   * 2. Copy the generated site ID into portfolio-config.js:
   *    window.PORTFOLIO_COUNTER_ID = "YOUR_SITE_ID";
   *
   * No analytics request is sent while the ID is empty.
   */
  var provider = window.PORTFOLIO_ANALYTICS_PROVIDER;
  var counterId = window.PORTFOLIO_COUNTER_ID;

  if (provider !== "counter" || !counterId) {
    return;
  }

  var script = document.createElement("script");
  script.src = "https://cdn.counter.dev/script.js";
  script.dataset.id = counterId;
  script.dataset.utcoffset = "-3";
  script.async = true;
  document.head.appendChild(script);
})();
