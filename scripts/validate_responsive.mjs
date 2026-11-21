import { chromium } from "playwright";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("_site");
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".html") ? [full] : [];
  }));
  return nested.flat();
}
const files = (await walk(root)).sort();
const failures = [];
const browserErrors = [];
const browserConsoleErrors = [];
const requestFailures = [];
const pages = [];
const contactMeasurements = [];
const primaryMeasurements = [];
const baselineMeasurements = new Map();
let redirects = 0;
for (const file of files) {
  const route = "/" + path.relative(root, file).split(path.sep).join("/");
  let targetFile = file;
  let testRoute = route;
  for (let hop = 0; hop < 5; hop++) {
    const html = await readFile(targetFile, "utf8");
    const refreshTag = html.match(/<meta\b[^>]*http-equiv=["']refresh["'][^>]*>/i);
    if (!refreshTag) break;
    const content = refreshTag[0].match(/\bcontent=["']([^"']+)["']/i)?.[1] || "";
    const targetMatch = content.match(/url\s*=\s*(.+)$/i);
    if (!targetMatch) break;
    const target = targetMatch[1].trim().replace(/^["']|["']$/g, "").split(/[?#]/)[0];
    if (target.startsWith("http://") || target.startsWith("https://")) {
      failures.push(route + ": external meta-refresh target is not valid for local responsive testing");
      break;
    }
    targetFile = target.startsWith("/")
      ? path.resolve(root, "." + target)
      : path.resolve(path.dirname(targetFile), target);
    try {
      await access(targetFile);
    } catch {
      failures.push(route + ": meta-refresh target does not exist: " + target);
      break;
    }
    testRoute = "/" + path.relative(root, targetFile).split(path.sep).join("/");
    redirects++;
  }
  pages.push({ route, testRoute });
}
const sizes = [{width:360,height:800},{width:390,height:844},{width:768,height:1024},{width:1024,height:900},{width:1440,height:900}];
const browser = await chromium.launch({headless:true});
let checked = 0;
const evidenceDir = path.resolve("artifacts/responsive-audit");
const beforeDir = path.join(evidenceDir, "before");
const afterDir = path.join(evidenceDir, "after");
await mkdir(beforeDir, { recursive: true });
await mkdir(afterDir, { recursive: true });

/* Captura o estado publicado antes da mudança, antes de executar o deploy. */
for (const [locale, url] of [
  ["pt", "https://c2shespanhol-ops.github.io/meuportifolio/"],
  ["en", "https://c2shespanhol-ops.github.io/meuportifolio/en/"]
]) {
  const baselinePage = await browser.newPage();
  for (const viewport of sizes) {
    await baselinePage.setViewportSize(viewport);
    await baselinePage.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await baselinePage.locator(".actions .action-card").first().waitFor({ state: "visible", timeout: 10000 });
    await baselinePage.locator(".actions").screenshot({
      path: path.join(beforeDir, locale + "-" + viewport.width + "px.png")
    });
    const baselineContact = baselinePage.locator("#contato, #contact").first();
    if (await baselineContact.count()) {
      await baselineContact.screenshot({
        path: path.join(beforeDir, locale + "-contact-" + viewport.width + "px.png")
      });
    }
    const baselineGeometry = await baselinePage.evaluate(() => {
      const measure = selector => Array.from(document.querySelectorAll(selector)).map(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const icon = element.querySelector("svg")?.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          fontSize: parseFloat(style.fontSize),
          iconWidth: Math.round(icon?.width || 0),
          iconHeight: Math.round(icon?.height || 0)
        };
      });
      return {
        contacts: measure(".contact-actions > a.action-card")
      };
    });
    baselineMeasurements.set(locale + "-" + viewport.width, baselineGeometry);
  }
  await baselinePage.close();
}

async function waitForPageCondition(page, label, predicate) {
  try {
    await page.waitForFunction(predicate, null, { timeout: 5000 });
  } catch (error) {
    throw new Error(label + ": " + error.message);
  }
}

for (const entry of pages) {
  const { route, testRoute } = entry;
  const page = await browser.newPage();
  page.on("pageerror", error => browserErrors.push({ route, message: error.message }));
  page.on("console", message => {
    if (message.type() === "error") browserConsoleErrors.push({ route, message: message.text() });
  });
  page.on("requestfailed", request => requestFailures.push({ route, url: request.url(), error: request.failure()?.errorText || "unknown" }));
  for (const viewport of sizes) {
    await page.setViewportSize(viewport);
    try {
      await page.goto("http://127.0.0.1:8765" + testRoute, {waitUntil:"domcontentloaded",timeout:15000});
      await page.waitForLoadState("load", { timeout: 15000 });
      await waitForPageCondition(page, "local stylesheet readiness", () =>
        Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
          .filter(link => link.href.startsWith(location.origin))
          .every(link => link.sheet !== null)
      );
      await page.evaluate(() => new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      ));
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
      });
      await page.evaluate(() => new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      ));
      const scrollPositionAtTop = await page.evaluate(() => window.scrollY);
      if (scrollPositionAtTop > 2) {
        failures.push(route + " @ " + viewport.width + "px: test setup did not reset the page to the top");
      }
      const result = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        const data = {
          viewport: innerWidth,
          documentWidth: root.clientWidth,
          documentScrollWidth: root.scrollWidth,
          bodyScrollWidth: body.scrollWidth,
          brokenTable: null
        };
        const metrics = document.querySelector(".metrics-table");
        if (metrics) {
          const wrapper = metrics.closest(".metrics-table-wrap");
          data.brokenTable = {
            tableWidth: Math.round(metrics.getBoundingClientRect().width),
            wrapperWidth: wrapper ? Math.round(wrapper.getBoundingClientRect().width) : null,
            wrapperScrollWidth: wrapper ? wrapper.scrollWidth : null,
            wrapperClientWidth: wrapper ? wrapper.clientWidth : null,
            overflowX: wrapper ? getComputedStyle(wrapper).overflowX : null,
            minWidth: getComputedStyle(metrics).minWidth
          };
        }
        return data;
      });
      checked++;
      if (result.documentScrollWidth > result.documentWidth + 1 || result.bodyScrollWidth > result.documentWidth + 1) {
        failures.push(route + " @ " + viewport.width + "px: horizontal page overflow " + JSON.stringify(result));
      }
      if (result.brokenTable && viewport.width < 680) {
        const t = result.brokenTable;
        if (t.wrapperWidth === null || t.wrapperWidth > viewport.width + 1 || t.wrapperScrollWidth <= t.wrapperClientWidth || !["auto","scroll"].includes(t.overflowX) || t.tableWidth < 679) {
          failures.push(route + " @ " + viewport.width + "px: metrics table is not safely scrollable/readable " + JSON.stringify(result));
        }
      }

      const isHomeRoute = route === "/index.html" || route === "/en/index.html";
      const contactButtonsCount = isHomeRoute ? await page.locator(".contact-actions > a.action-card").count() : 0;
      if (isHomeRoute && contactButtonsCount !== 2) failures.push(route + " @ " + viewport.width + "px: expected exactly two contact action cards, found " + contactButtonsCount);
      if (contactButtonsCount) {
        const contactAudit = await page.locator(".contact-actions").first().evaluate(container => {
          const containerRect = container.getBoundingClientRect();
          const containerStyle = getComputedStyle(container);
          return {
            width: Math.round(containerRect.width),
            clientWidth: container.clientWidth,
            scrollWidth: container.scrollWidth,
            direction: containerStyle.flexDirection,
            buttons: Array.from(container.querySelectorAll("a.action-card")).map(element => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return {
                text: element.textContent.trim(),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                top: Math.round(rect.top),
                left: Math.round(rect.left),
                clientWidth: element.clientWidth,
                scrollWidth: element.scrollWidth,
                whiteSpace: style.whiteSpace
              };
            })
          };
        });
        contactMeasurements.push({route, viewport: viewport.width, ...contactAudit});
        const invalidHeight = contactAudit.buttons.length !== 2 || contactAudit.buttons.some(button =>
          button.height < 44 ||
          button.height > 64 ||
          button.width <= 0 ||
          button.scrollWidth > button.clientWidth + 1
        );
        if (contactAudit.scrollWidth > contactAudit.clientWidth + 1 || invalidHeight) {
          failures.push(route + " @ " + viewport.width + "px: contact button dimensions or clipping failed " + JSON.stringify(contactAudit));
        }
        if (contactAudit.direction !== "row" ||
            Math.abs(contactAudit.buttons[0]?.top - contactAudit.buttons[1]?.top) > 1 ||
            contactAudit.buttons[1]?.left < contactAudit.buttons[0]?.left + contactAudit.buttons[0]?.width) {
          failures.push(route + " @ " + viewport.width + "px: contact buttons must remain side by side " + JSON.stringify(contactAudit));
        }
        if (isHomeRoute) {
          const localeKey = route === "/index.html" ? "pt" : "en";
          const before = baselineMeasurements.get(localeKey + "-" + viewport.width);
          if (!before || before.contacts.length !== 2 ||
              contactAudit.buttons.some((button, index) => Math.abs(button.width - before.contacts[index].width) > 1)) {
            failures.push(route + " @ " + viewport.width + "px: contact button widths changed from the published baseline " + JSON.stringify({before:before?.contacts,after:contactAudit.buttons}));
          }
        }
      }
      if (route === "/index.html" || route === "/en/index.html") {
        const actionAudit = await page.locator(".actions .action-card").evaluateAll(elements => {
          const parent = document.querySelector(".actions");
          return {
            parentDisplay: getComputedStyle(parent).display,
            parentDirection: getComputedStyle(parent).flexDirection,
            parentWidth: Math.round(parent.getBoundingClientRect().width),
            buttons: elements.map(element => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              const icon = element.querySelector("svg")?.getBoundingClientRect();
              return {
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                top: Math.round(rect.top),
                left: Math.round(rect.left),
                fontSize: parseFloat(style.fontSize),
                iconWidth: Math.round(icon?.width || 0),
                iconHeight: Math.round(icon?.height || 0)
              };
            })
          };
        });
        if (actionAudit.buttons.length !== 2 ||
            actionAudit.buttons.some(button => button.height < 44 || button.height > 56 ||
              button.width > actionAudit.parentWidth + 1 || button.fontSize < 15 || button.fontSize > 16 ||
              button.iconWidth !== 20 || button.iconHeight !== 20)) {
          failures.push(route + " @ " + viewport.width + "px: primary action sizing failed " + JSON.stringify(actionAudit));
        }
        primaryMeasurements.push({route, viewport: viewport.width, ...actionAudit});
        if (viewport.width <= 700) {
          if (actionAudit.parentDisplay !== "grid" ||
              Math.abs(actionAudit.buttons[0].top - actionAudit.buttons[1].top) > 1 ||
              actionAudit.buttons[1].left < actionAudit.buttons[0].left + actionAudit.buttons[0].width) {
            failures.push(route + " @ " + viewport.width + "px: primary actions must remain in the approved two-column mobile grid " + JSON.stringify(actionAudit));
          }
        } else if (actionAudit.parentDirection !== "row" ||
                   Math.abs(actionAudit.buttons[0].top - actionAudit.buttons[1].top) > 1 ||
                   actionAudit.buttons[1].left < actionAudit.buttons[0].left + actionAudit.buttons[0].width) {
          failures.push(route + " @ " + viewport.width + "px: primary actions must remain side by side " + JSON.stringify(actionAudit));
        }
        await page.locator(".actions").screenshot({
          path: path.join(afterDir, (route === "/index.html" ? "pt" : "en") + "-" + viewport.width + "px.png")
        });
        await page.locator("#contato, #contact").first().screenshot({
          path: path.join(afterDir, (route === "/index.html" ? "pt" : "en") + "-contact-" + viewport.width + "px.png")
        });
        const image = await page.locator(".about-photo img").first().evaluate(el => ({complete:el.complete,naturalWidth:el.naturalWidth})).catch(() => null);
        const fallback = await page.locator(".about-photo .photo-fallback-mark").count();
        if ((!image || !image.complete || image.naturalWidth === 0) && !fallback) {
          failures.push(route + " @ " + viewport.width + "px: profile image did not load and no fallback exists");
        }
        await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
      });
        await page.evaluate(() => new Promise(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        ));
        try {
          await waitForPageCondition(page, "privacy preferences API readiness", () =>
            typeof window.portfolioOpenPrivacyPreferences === "function"
          );
        } catch (error) {
          const diagnostic = await page.evaluate(() => ({
            readyState: document.readyState,
            consentFunction: typeof window.portfolioOpenPrivacyPreferences,
            stickyPresent: !!document.querySelector(".sticky-cta"),
            consentScript: Array.from(document.scripts).filter(script => script.src.includes("privacy-consent.js")).map(script => script.src),
            consentScriptLoaded: performance.getEntriesByType("resource").some(entry => entry.name.includes("privacy-consent.js")),
            localStylesheets: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).filter(link => link.href.startsWith(location.origin)).map(link => ({ href: link.href, loaded: !!link.sheet }))
          }));
          throw new Error(error.message + " | diagnostic=" + JSON.stringify({ ...diagnostic, browserErrors, browserConsoleErrors, requestFailures }));
        }
        await waitForPageCondition(page, "WhatsApp initial visibility state", () => {
          const sticky = document.querySelector(".sticky-cta");
          if (!sticky) return false;
          const style = getComputedStyle(sticky);
          const maxScroll = Math.max(0,
            Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight
          );
          return maxScroll === 0
            ? style.visibility === "visible" && style.opacity === "1" && sticky.tabIndex === 0
            : style.visibility === "hidden" && style.opacity === "0" && sticky.tabIndex === -1;
        });
        await page.waitForTimeout(100);
        const contactAudit = await page.evaluate(() => {
          const sticky = document.querySelector(".sticky-cta");
          const target = document.getElementById("contato") || document.getElementById("contact");
          const email = target && target.querySelector('a[href^="mailto:"]');
          const contactWhatsApp = target && target.querySelector('a[href^="https://wa.me/"]');
          if (!sticky) return { error: "floating WhatsApp shortcut is missing" };
          const rect = sticky.getBoundingClientRect();
          const style = getComputedStyle(sticky);
          return {
            display: style.display,
            position: style.position,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            background: style.backgroundColor,
            ariaLabel: sticky.getAttribute("aria-label"),
            left: Math.round(rect.left),
            right: Math.round(innerWidth - rect.right),
            iconWidth: Math.round(sticky.querySelector("svg")?.getBoundingClientRect().width || 0),
            iconHeight: Math.round(sticky.querySelector("svg")?.getBoundingClientRect().height || 0),
            opacity: style.opacity,
            visibility: style.visibility,
            tabIndex: sticky.tabIndex,
            ariaHidden: sticky.getAttribute("aria-hidden"),
            top: rect.top,
            radius: style.borderRadius,
            href: sticky.getAttribute("href"),
            text: sticky.textContent.trim(),
            targetExists: !!target,
            emailExists: !!email,
            contactWhatsAppExists: !!contactWhatsApp,
            scrollY: window.scrollY,
            rootScrollHeight: document.documentElement.scrollHeight,
            bodyScrollHeight: document.body.scrollHeight,
            innerHeight: window.innerHeight,
            maxScroll: Math.max(0, Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight),
            stickyClass: sticky.className,
            tooltip: getComputedStyle(sticky, "::after").content
          };
        });
        if (contactAudit.error || contactAudit.display === "none" ||
            contactAudit.position !== "fixed" ||
            contactAudit.width !== (viewport.width >= 600 ? 56 : 52) ||
            contactAudit.height !== (viewport.width >= 600 ? 56 : 52) ||
            contactAudit.iconWidth !== 24 || contactAudit.iconHeight !== 24 ||
            contactAudit.background !== "rgb(37, 211, 102)" ||
            contactAudit.ariaLabel !== (route === "/index.html" ? "Conversar no WhatsApp" : "Chat on WhatsApp") ||
            contactAudit.left < 15 || contactAudit.left > 20 || contactAudit.right < 15 ||
            (contactAudit.maxScroll === 0
              ? contactAudit.opacity !== "1" || contactAudit.visibility !== "visible" || contactAudit.tabIndex !== 0 || contactAudit.ariaHidden !== "false"
              : contactAudit.opacity !== "0" || contactAudit.visibility !== "hidden" || contactAudit.tabIndex !== -1 || contactAudit.ariaHidden !== "true") ||
            !contactAudit.radius.includes("50%") || contactAudit.text !== "" ||
            !contactAudit.targetExists || !contactAudit.emailExists ||
            contactAudit.contactWhatsAppExists ||
            !contactAudit.href || !contactAudit.href.startsWith("https://wa.me/") ||
            /NOME|NAME/i.test(contactAudit.href)) {
          failures.push(route + " @ " + viewport.width + "px: floating WhatsApp shortcut regression " + JSON.stringify(contactAudit));
        }
        await page.mouse.move(10, 10);
        await page.evaluate(() => {
          document.documentElement.style.scrollBehavior = "auto";
          window.scrollTo(0, Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
        });
        await waitForPageCondition(page, "scroll-to-bottom completion", () => {
          const maxScroll = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight;
          return Math.abs(window.scrollY - Math.max(0, maxScroll)) <= 2;
        });
        await page.waitForTimeout(300);
        await page.evaluate(() => new Promise(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        ));
        const stickyAfterScroll = await page.evaluate(() => {
          const sticky = document.querySelector(".sticky-cta");
          const top = document.querySelector(".to-top");
          const rect = sticky.getBoundingClientRect();
          const topRect = top.getBoundingClientRect();
          const style = getComputedStyle(sticky);
          const topStyle = getComputedStyle(top);
          return {
            position: style.position, top: rect.top, left: Math.round(rect.left), display: style.display, visibility: style.visibility,
            color: style.color, opacity: style.opacity, tabIndex: sticky.tabIndex,
            ariaHidden: sticky.getAttribute("aria-hidden"),
            width: Math.round(rect.width), height: Math.round(rect.height),
            topButtonWidth: Math.round(topRect.width), topButtonHeight: Math.round(topRect.height),
            verticalGap: Math.round(topRect.top - rect.bottom),
            topButtonDisplay: topStyle.display
          };
        });
        if (stickyAfterScroll.position !== "fixed" || stickyAfterScroll.display === "none" ||
            stickyAfterScroll.visibility !== "visible" || stickyAfterScroll.opacity !== "1" ||
            stickyAfterScroll.tabIndex !== 0 || stickyAfterScroll.ariaHidden !== "false" ||
            stickyAfterScroll.left < 15 || stickyAfterScroll.left > 20 ||
            Math.abs(stickyAfterScroll.top - contactAudit.top) > 1 ||
            stickyAfterScroll.color !== "rgb(255, 255, 255)" ||
            stickyAfterScroll.width !== (viewport.width >= 600 ? 56 : 52) ||
            stickyAfterScroll.height !== (viewport.width >= 600 ? 56 : 52) ||
            stickyAfterScroll.topButtonWidth !== stickyAfterScroll.width ||
            stickyAfterScroll.topButtonHeight !== stickyAfterScroll.height ||
            stickyAfterScroll.verticalGap !== 12 ||
            stickyAfterScroll.topButtonDisplay === "none") {
          failures.push(route + " @ " + viewport.width + "px: floating WhatsApp/top buttons geometry or icon color regression " + JSON.stringify(stickyAfterScroll));
        }
        if (viewport.width >= 960) {
          await page.locator(".sticky-cta").hover();
          await page.waitForTimeout(250);
          const tooltipVisible = await page.locator(".sticky-cta").evaluate(el =>
            getComputedStyle(el, "::after").opacity === "1" &&
            getComputedStyle(el, "::after").visibility === "visible"
          );
          if (!tooltipVisible || !contactAudit.tooltip.includes("Quer conversar") && route === "/index.html") {
            failures.push(route + " @ " + viewport.width + "px: desktop WhatsApp invitation tooltip did not appear");
          }
        }
      }
    } catch (error) {
      const diagnostic = await page.evaluate(() => ({
        readyState: document.readyState,
        consentFunction: typeof window.portfolioOpenPrivacyPreferences,
        stickyPresent: !!document.querySelector(".sticky-cta"),
        scripts: Array.from(document.scripts).map(script => ({
          src: script.src,
          defer: script.defer,
          async: script.async
        })).filter(script => script.src.includes("site.js") || script.src.includes("privacy-consent.js")),
        localStylesheets: Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
          .filter(link => link.href.startsWith(location.origin))
          .map(link => ({ href: link.href, loaded: !!link.sheet, media: link.media })),
        stickyState: (() => {
          const sticky = document.querySelector(".sticky-cta");
          if (!sticky) return null;
          const style = getComputedStyle(sticky);
          return {
            documentHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
            maxScroll: Math.max(0, Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - innerHeight),
            scrollY: window.scrollY,
            visibility: style.visibility,
            opacity: style.opacity,
            tabIndex: sticky.tabIndex,
            ariaHidden: sticky.getAttribute("aria-hidden"),
            className: sticky.className
          };
        })()
      })).catch(e => ({ diagnosticError: e.message }));
      failures.push(route + " @ " + viewport.width + "px: " + error.message +
        " | diagnostic=" + JSON.stringify({ ...diagnostic, browserErrors, browserConsoleErrors, requestFailures }));
    }
  }
  await page.close();
}
await browser.close();
if (contactMeasurements.length !== 10) {
  failures.push("Expected 10 PT/EN contact measurements (two buttons at five viewport widths), found " + contactMeasurements.length);
}
await writeFile(path.join(evidenceDir, "measurements.json"), JSON.stringify({
  viewportWidths: sizes.map(item => item.width),
  baseline: Object.fromEntries(baselineMeasurements),
  contactMeasurements,
  primaryMeasurements,
  failures
}, null, 2));
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Contact button measurements: " + JSON.stringify(contactMeasurements));
console.log("Responsive regression passed: " + pages.length + " HTML routes x " + sizes.length + " viewports (" + checked + " renders); primary actions verified in PT/EN at 360, 390, 768, 1024 and 1440px; primary and contact before/after screenshots saved; " + redirects + " meta-refresh aliases resolved to their destination pages.");
