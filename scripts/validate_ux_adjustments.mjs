import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = "https://c2shespanhol-ops.github.io/meuportifolio";
const LOCAL = "http://127.0.0.1:8765";
const OUT = path.resolve("artifacts/responsive-audit/ux-adjustments");
const BEFORE = path.join(OUT, "before");
const AFTER = path.join(OUT, "after");
await mkdir(BEFORE, { recursive: true });
await mkdir(AFTER, { recursive: true });

const headerCases = [
  { id: "home-pt", before: BASE + "/", after: LOCAL + "/index.html" },
  { id: "home-en", before: BASE + "/en/", after: LOCAL + "/en/index.html" },
  { id: "project-pt", before: BASE + "/projeto-assistente-virtual.html", after: LOCAL + "/projeto-assistente-virtual.html" }
];
const report = { whatsapp: [], headers: [], projects: [] };
const browser = await chromium.launch({ headless: true });

async function ready(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("load", { timeout: 30000 });
  await page.locator(".site-header").waitFor({ state: "visible", timeout: 15000 });
  await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
  await page.evaluate(() => new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  ));
}

async function captureHeader(page, id, phase, blurred) {
  await page.locator(".site-header").screenshot({
    path: path.join(phase === "before" ? BEFORE : AFTER, id + "-header-390.png")
  });
  if (blurred) {
    await page.addStyleTag({ content: "html { filter: blur(5px); }" });
    await page.screenshot({
      path: path.join(phase === "before" ? BEFORE : AFTER, id + "-first-screen-blur-5px-390.png"),
      fullPage: false
    });
  }
}

for (const item of headerCases) {
  const beforePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await ready(beforePage, item.before);
  const beforeHeight = await beforePage.locator(".site-header").evaluate(el => Math.round(el.getBoundingClientRect().height));
  await captureHeader(beforePage, item.id, "before", item.id !== "home-en");
  await beforePage.close();

  const afterPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await ready(afterPage, item.after);
  const afterHeight = await afterPage.locator(".site-header").evaluate(el => Math.round(el.getBoundingClientRect().height));
  await captureHeader(afterPage, item.id, "after", item.id !== "home-en");
  const headerAudit = await afterPage.evaluate(() => {
    const nav = document.querySelector(".site-header .nav-links");
    const lang = document.querySelector(".site-header .lang");
    const brand = document.querySelector(".site-header .brand");
    const targets = Array.from(document.querySelectorAll(".site-header .nav-links a, .site-header .lang a"));
    return {
      documentWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      navDisplay: getComputedStyle(nav).display,
      navFlexWrap: getComputedStyle(nav).flexWrap,
      navOverflowX: getComputedStyle(nav).overflowX,
      navClientWidth: nav.clientWidth,
      navScrollWidth: nav.scrollWidth,
      brandNameWidth: document.querySelector(".brand-name").clientWidth,
      brandNameScrollWidth: document.querySelector(".brand-name").scrollWidth,
      brandRoleWidth: document.querySelector(".brand-role").clientWidth,
      brandRoleScrollWidth: document.querySelector(".brand-role").scrollWidth,
      langTop: Math.round(lang.getBoundingClientRect().top),
      brandTop: Math.round(brand.getBoundingClientRect().top),
      targets: targets.map(el => Math.round(el.getBoundingClientRect().height))
    };
  });
  assert.equal(headerAudit.navDisplay, "flex", item.id + ": navigation must remain flex");
  assert.equal(headerAudit.navFlexWrap, "nowrap", item.id + ": mobile navigation must stay on one line");
  assert.equal(headerAudit.navOverflowX, "auto", item.id + ": mobile navigation must scroll horizontally when needed");
  assert.ok(headerAudit.documentScrollWidth <= headerAudit.documentWidth, item.id + ": page must not overflow horizontally");
  assert.ok(headerAudit.brandNameScrollWidth <= headerAudit.brandNameWidth + 1, item.id + ": brand name must not be clipped");
  assert.ok(headerAudit.brandRoleScrollWidth <= headerAudit.brandRoleWidth + 1, item.id + ": role must not be clipped");
  assert.ok(headerAudit.targets.every(height => height >= 44), item.id + ": every header link must have a 44px touch target");
  assert.ok(Math.abs(headerAudit.langTop - headerAudit.brandTop) <= 4, item.id + ": language switcher must align with the brand row");
  const reduction = beforeHeight - afterHeight;
  report.headers.push({ page: item.id, viewport: 390, beforeHeight, afterHeight, reduction, ...headerAudit });
  assert.ok(reduction >= 40, item.id + ": header must be at least 40px shorter at 390px, measured " + reduction + "px");
  await afterPage.close();

  const beforeWide = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await ready(beforeWide, item.before);
  const beforeWideHeight = await beforeWide.locator(".site-header").evaluate(el => Math.round(el.getBoundingClientRect().height));
  await beforeWide.close();
  const afterWide = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await ready(afterWide, item.after);
  const afterWideHeight = await afterWide.locator(".site-header").evaluate(el => Math.round(el.getBoundingClientRect().height));
  assert.ok(Math.abs(beforeWideHeight - afterWideHeight) <= 1, item.id + ": header at 1280px must remain unchanged");
  report.headers.push({ page: item.id, viewport: 1280, beforeHeight: beforeWideHeight, afterHeight: afterWideHeight, reduction: beforeWideHeight - afterWideHeight });
  await afterWide.close();
}

const whatsappPages = [
  { route: "/index.html", name: "home PT" },
  { route: "/en/index.html", name: "home EN" },
  { route: "/projeto-assistente-virtual.html", name: "project PT" }
];
for (const item of whatsappPages) {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    await ready(page, LOCAL + item.route);
    const initial = await page.locator(".sticky-cta").evaluate(el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        visibility: style.visibility,
        opacity: style.opacity,
        tabIndex: el.tabIndex,
        ariaHidden: el.getAttribute("aria-hidden"),
        background: style.backgroundColor,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        fabSize: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fab-size")),
        href: el.href
      };
    });
    assert.equal(initial.visibility, "hidden", item.name + " " + width + "px: WhatsApp must be hidden at the top");
    assert.equal(initial.opacity, "0", item.name + " " + width + "px: hidden state must be transparent");
    assert.equal(initial.tabIndex, -1, item.name + " " + width + "px: hidden WhatsApp must not receive keyboard focus");
    assert.equal(initial.ariaHidden, "true", item.name + " " + width + "px: hidden WhatsApp must be removed from the accessibility tree");
    assert.equal(initial.background, "rgb(37, 211, 102)", item.name + " " + width + "px: WhatsApp brand color must remain unchanged");
    assert.equal(initial.width, initial.fabSize, item.name + " " + width + "px: WhatsApp width must remain --fab-size");
    assert.equal(initial.height, initial.fabSize, item.name + " " + width + "px: WhatsApp height must remain --fab-size");
    assert.ok(initial.href.startsWith("https://wa.me/"), item.name + " " + width + "px: WhatsApp destination must remain wa.me");

    const scrollTarget = await page.evaluate(() => {
      const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const maxScroll = Math.max(0, documentHeight - innerHeight);
      const threshold = Math.min(documentHeight * 0.35, 600);
      return { maxScroll, threshold, target: maxScroll < threshold ? maxScroll : threshold };
    });
    await page.evaluate(target => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, target);
    }, scrollTarget.target);
    await page.waitForTimeout(300);
    const after = await page.locator(".sticky-cta").evaluate(el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        visibility: style.visibility,
        opacity: style.opacity,
        tabIndex: el.tabIndex,
        ariaHidden: el.getAttribute("aria-hidden"),
        background: style.backgroundColor,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        href: el.href
      };
    });
    assert.equal(after.visibility, "visible", item.name + " " + width + "px: WhatsApp must appear after scrolling");
    assert.equal(after.opacity, "1", item.name + " " + width + "px: visible state must be opaque");
    assert.equal(after.tabIndex, 0, item.name + " " + width + "px: visible WhatsApp must be keyboard accessible");
    assert.equal(after.ariaHidden, "false", item.name + " " + width + "px: visible WhatsApp must be exposed to assistive technology");
    assert.equal(after.background, "rgb(37, 211, 102)", item.name + " " + width + "px: WhatsApp brand color must remain unchanged");
    assert.equal(after.width, initial.fabSize, item.name + " " + width + "px: WhatsApp width must remain unchanged");
    assert.equal(after.height, initial.fabSize, item.name + " " + width + "px: WhatsApp height must remain unchanged");
    assert.equal(after.href, initial.href, item.name + " " + width + "px: WhatsApp link and message must remain unchanged");
    if (item.route === "/index.html" && width === 390) {
      const normalMotion = await page.locator(".sticky-cta").evaluate(el =>
        getComputedStyle(el).transitionDuration.split(",").some(value => parseFloat(value) > 0)
      );
      assert.equal(normalMotion, true, "WhatsApp reveal must animate when reduced motion is not requested");
      await page.emulateMedia({ reducedMotion: "reduce" });
      const reducedMotion = await page.locator(".sticky-cta").evaluate(el =>
        getComputedStyle(el).transitionDuration.split(",").every(value => parseFloat(value) === 0)
      );
      assert.equal(reducedMotion, true, "WhatsApp reveal must disable transitions for prefers-reduced-motion");
    }
    report.whatsapp.push({ page: item.name, viewport: width, threshold: scrollTarget.threshold, maxScroll: scrollTarget.maxScroll, scrollY: scrollTarget.target, initial, after });
    await page.close();
  }
}

const projectPages = [
  ["projeto-assistente-virtual.html", "outros-projetos", "Outros projetos", "Todos os cases"],
  ["projeto-gestao-de-demandas.html", "outros-projetos", "Outros projetos", "Todos os cases"],
  ["projeto-habitat.html", "outros-projetos", "Outros projetos", "Todos os cases"],
  ["projeto-pav-atendimento-virtual.html", "outros-projetos", "Outros projetos", "Todos os cases"],
  ["en/project-virtual-assistant.html", "other-projects", "Other projects", "All cases"],
  ["en/project-demand-management.html", "other-projects", "Other projects", "All cases"],
  ["en/project-habitat.html", "other-projects", "Other projects", "All cases"],
  ["en/project-pav-virtual-service.html", "other-projects", "Other projects", "All cases"]
];
for (const [route, id, heading, allLabel] of projectPages) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await ready(page, LOCAL + "/" + route);
  const audit = await page.evaluate(({ id, heading, allLabel }) => {
    const main = document.querySelector("main");
    const section = main.querySelector('[aria-labelledby="' + id + '"]');
    const title = section?.querySelector("h2")?.textContent.trim();
    const links = Array.from(section?.querySelectorAll("a") || []).map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute("href")
    }));
    const next = main.querySelector(".next-case");
    const contacts = main.querySelector("#contato, #contact");
    const primaryCount = main.querySelectorAll(".btn.primary").length;
    const nextButtonCount = next?.querySelectorAll(".btn").length ?? 0;
    const ordered = !!section && !!next && !!contacts &&
      !!(section.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      !!(next.compareDocumentPosition(contacts) & Node.DOCUMENT_POSITION_FOLLOWING);
    return { title, links, primaryCount, nextButtonCount, ordered, allLabel, heading };
  }, { id, heading, allLabel });
  assert.equal(audit.title, heading, route + ": combined projects block heading mismatch");
  assert.equal(audit.links.length, 4, route + ": projects block must contain four links");
  assert.equal(audit.links[3].text, allLabel, route + ": fourth link must be the all-cases link");
  assert.equal(audit.links[3].href, "index.html", route + ": all-cases link must point to the localized index");
  assert.equal(audit.primaryCount, 1, route + ": exactly one primary .btn may remain in the page body");
  assert.equal(audit.nextButtonCount, 1, route + ": the main CTA must be the only button in its CTA block");
  assert.equal(audit.ordered, true, route + ": order must be projects, one main CTA, then contacts");
  report.projects.push({ route, ...audit });
  await page.close();
}

await browser.close();
await writeFile(path.join(OUT, "ux-adjustments-report.json"), JSON.stringify(report, null, 2));
console.log("UX adjustments proof: " + JSON.stringify(report));
