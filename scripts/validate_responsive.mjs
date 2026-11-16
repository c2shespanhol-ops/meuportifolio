import { chromium } from "playwright";
import { readdir } from "node:fs/promises";
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
const pages = (await walk(root)).map(file => "/" + path.relative(root, file).split(path.sep).join("/")).sort();
const sizes = [{width:390,height:844},{width:768,height:1024},{width:1440,height:900}];
const browser = await chromium.launch({headless:true});
const failures = [];
let checked = 0;

for (const route of pages) {
  const page = await browser.newPage();
  for (const viewport of sizes) {
    await page.setViewportSize(viewport);
    try {
      await page.goto("http://127.0.0.1:8765" + route, {waitUntil:"domcontentloaded",timeout:15000});
      await page.waitForFunction(() => Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .filter(link => link.href.startsWith(location.origin))
        .every(link => link.sheet !== null), {timeout:5000});
      await page.evaluate(() => new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      ));
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
      if (route === "/index.html" || route === "/en/index.html") {
        const image = await page.locator(".about-photo img").first().evaluate(el => ({complete:el.complete,naturalWidth:el.naturalWidth})).catch(() => null);
        const fallback = await page.locator(".about-photo .photo-fallback-mark").count();
        if ((!image || !image.complete || image.naturalWidth === 0) && !fallback) {
          failures.push(route + " @ " + viewport.width + "px: profile image did not load and no fallback exists");
        }
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
            iconWidth: Math.round(sticky.querySelector("svg")?.getBoundingClientRect().width || 0),
            iconHeight: Math.round(sticky.querySelector("svg")?.getBoundingClientRect().height || 0),
            opacity: style.opacity,
            visibility: style.visibility,
            top: rect.top,
            radius: style.borderRadius,
            href: sticky.getAttribute("href"),
            text: sticky.textContent.trim(),
            targetExists: !!target,
            emailExists: !!email,
            contactWhatsAppExists: !!contactWhatsApp,
            tooltip: getComputedStyle(sticky, "::after").content
          };
        });
        if (contactAudit.error || contactAudit.display === "none" ||
            contactAudit.position !== "fixed" ||
            contactAudit.width !== 52 || contactAudit.height !== 52 || contactAudit.iconWidth !== 24 || contactAudit.iconHeight !== 24 || contactAudit.opacity !== "1" || contactAudit.visibility !== "visible" ||
            !contactAudit.radius.includes("50%") || contactAudit.text !== "" ||
            !contactAudit.targetExists || !contactAudit.emailExists ||
            contactAudit.contactWhatsAppExists ||
            !contactAudit.href || !contactAudit.href.startsWith("https://wa.me/") ||
            /NOME|NAME/i.test(contactAudit.href)) {
          failures.push(route + " @ " + viewport.width + "px: floating WhatsApp shortcut regression " + JSON.stringify(contactAudit));
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
        await page.mouse.move(10, 10);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(100);
        const stickyAfterScroll = await page.locator(".sticky-cta").evaluate(el => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return { position: style.position, top: rect.top, display: style.display, visibility: style.visibility };
        });
        if (stickyAfterScroll.position !== "fixed" || stickyAfterScroll.display === "none" ||
            stickyAfterScroll.visibility === "hidden" ||
            Math.abs(stickyAfterScroll.top - contactAudit.top) > 1) {
          failures.push(route + " @ " + viewport.width + "px: floating WhatsApp shortcut did not remain fixed through the end of the page " + JSON.stringify(stickyAfterScroll));
        }
      }
    } catch (error) {
      failures.push(route + " @ " + viewport.width + "px: " + error.message);
    }
  }
  await page.close();
}
await browser.close();
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Responsive regression passed: " + pages.length + " HTML pages x " + sizes.length + " viewports (" + checked + " renders).");
