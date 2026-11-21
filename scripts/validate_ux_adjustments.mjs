import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = "https://c2shespanhol-ops.github.io/meuportifolio";
const LOCAL = "http://127.0.0.1:8765";
const ROOT = path.resolve("_site");
const OUT = path.resolve("artifacts/responsive-audit/ux-adjustments");
const BEFORE = path.join(OUT, "before");
const AFTER = path.join(OUT, "after");
await mkdir(BEFORE, { recursive: true });
await mkdir(AFTER, { recursive: true });

const headerCases = [
  { id: "home-pt", family: "home PT", before: BASE + "/", after: LOCAL + "/index.html", kind: "brand" },
  { id: "home-en", family: "home EN", before: BASE + "/en/", after: LOCAL + "/en/index.html", kind: "brand" },
  { id: "case-pt", family: "case PT", before: BASE + "/case_study_02_leadtime_final.html", after: LOCAL + "/case_study_02_leadtime_final.html", kind: "case-bar" },
  { id: "case-en", family: "case EN", before: BASE + "/en/cases/case-02-lead-time-governance.html", after: LOCAL + "/en/cases/case-02-lead-time-governance.html", kind: "case-bar" },
  { id: "project-pt", family: "project PT", before: BASE + "/projeto-assistente-virtual.html", after: LOCAL + "/projeto-assistente-virtual.html", kind: "case-bar" },
  { id: "project-en", family: "project EN", before: BASE + "/en/project-virtual-assistant.html", after: LOCAL + "/en/project-virtual-assistant.html", kind: "case-bar" }
];
const report = {
  whatsapp: [],
  headers: [],
  projects: [],
  caseNavigation: [
    { family: "cases completos PT", applied: false, reason: "A estrutura atual tem contador e bloco de próximo case com link secundário para voltar aos cases, sem bloco de navegação relacionado separado. A instrução condicional determinou aplicar somente A e B quando a estrutura diferisse." },
    { family: "cases completos EN", applied: false, reason: "A estrutura atual tem contador e bloco de próximo case com link secundário para voltar aos cases, sem bloco de navegação relacionado separado. A instrução condicional determinou aplicar somente A e B quando a estrutura diferisse." }
  ],
  privacy: { headerAdjustment: false, reason: "As páginas de privacidade não possuem cabeçalho de marca nem seletor PT | EN no cabeçalho. Não foi criado um cabeçalho novo nem alterado o conteúdo." }
};
async function walkHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkHtml(full);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".html") ? [full] : [];
  }));
  return nested.flat();
}
const allHtml = await walkHtml(ROOT);
const scopedHtml = allHtml.filter(file => {
  const route = path.relative(ROOT, file).split(path.sep).join("/");
  const isProject = (route.startsWith("projeto-") || route.startsWith("en/project-")) && route.endsWith(".html");
  const isPortugueseCase = route.startsWith("case_study_") || /^case[0-9]{2}_/.test(route);
  const isEnglishCase = route.startsWith("en/cases/") && route.endsWith(".html");
  return route === "index.html" || route === "en/index.html" ||
    route === "privacidade.html" || route === "en/privacy.html" ||
    isProject || isPortugueseCase || isEnglishCase;
});
for (const file of scopedHtml) {
  const html = await readFile(file, "utf8");
  const route = path.relative(ROOT, file).split(path.sep).join("/");
  assert.ok(html.includes("portfolio-theme.css"), route + ": shared theme stylesheet must be present");
  assert.ok(html.includes("privacy-consent.js"), route + ": shared bootstrap must load the WhatsApp behavior");
}
report.coverage = {
  totalPages: scopedHtml.length,
  routes: scopedHtml.map(file => path.relative(ROOT, file).split(path.sep).join("/"))
};

const browser = await chromium.launch({ headless: true });

async function ready(page, url, expectSticky = false) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("load", { timeout: 30000 });
  if (expectSticky) {
    await page.waitForFunction(() => !!document.querySelector(".sticky-cta"), null, { timeout: 15000 });
  }
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
  const headerSelector = item.kind === "brand" ? ".site-header" : ".site-header .case-bar";
  const beforeHeight = await beforePage.locator(headerSelector).evaluate(el => Math.round(el.getBoundingClientRect().height));
  await captureHeader(beforePage, item.id, "before", item.id === "home-pt" || item.id === "project-pt");
  await beforePage.close();

  const afterPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await ready(afterPage, item.after, true);
  const afterHeight = await afterPage.locator(headerSelector).evaluate(el => Math.round(el.getBoundingClientRect().height));
  await captureHeader(afterPage, item.id, "after", item.id === "home-pt" || item.id === "project-pt");

  const headerAudit = await afterPage.evaluate(kind => {
    const nav = document.querySelector(".site-header .nav-links");
    const lang = document.querySelector(".site-header .lang");
    const brand = document.querySelector(".site-header .brand");
    const targets = Array.from(document.querySelectorAll(".site-header .nav-links a, .site-header .case-bar .back-link, .site-header .case-bar .lang a"));
    const result = {
      documentWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      targets: targets.map(el => Math.round(el.getBoundingClientRect().height))
    };
    if (kind === "brand") {
      result.navDisplay = getComputedStyle(nav).display;
      result.navFlexWrap = getComputedStyle(nav).flexWrap;
      result.navOverflowX = getComputedStyle(nav).overflowX;
      result.navClientWidth = nav.clientWidth;
      result.navScrollWidth = nav.scrollWidth;
      result.brandNameWidth = document.querySelector(".brand-name").clientWidth;
      result.brandNameScrollWidth = document.querySelector(".brand-name").scrollWidth;
      result.brandRoleWidth = document.querySelector(".brand-role").clientWidth;
      result.brandRoleScrollWidth = document.querySelector(".brand-role").scrollWidth;
      result.langTop = Math.round(lang.getBoundingClientRect().top);
      result.brandTop = Math.round(brand.getBoundingClientRect().top);
    } else {
      const bar = document.querySelector(".site-header .case-bar");
      result.caseBarDisplay = getComputedStyle(bar).display;
      result.caseBarFlexWrap = getComputedStyle(bar).flexWrap;
      result.caseBarClientWidth = bar.clientWidth;
      result.caseBarScrollWidth = bar.scrollWidth;
      result.backLinkWidth = bar.querySelector(".back-link").clientWidth;
      result.backLinkScrollWidth = bar.querySelector(".back-link").scrollWidth;
      result.langTop = Math.round(lang.getBoundingClientRect().top);
      result.backTop = Math.round(bar.querySelector(".back-link").getBoundingClientRect().top);
    }
    return result;
  }, item.kind);

  assert.ok(headerAudit.documentScrollWidth <= headerAudit.documentWidth, item.family + ": page must not overflow horizontally");
  assert.ok(headerAudit.targets.length > 0 && headerAudit.targets.every(height => height >= 44), item.family + ": all header touch targets must be at least 44px");
  if (item.kind === "brand") {
    assert.equal(headerAudit.navDisplay, "flex", item.family + ": navigation must remain flex");
    assert.equal(headerAudit.navFlexWrap, "nowrap", item.family + ": mobile navigation must stay on one line");
    assert.equal(headerAudit.navOverflowX, "auto", item.family + ": mobile navigation must scroll horizontally when needed");
    assert.ok(headerAudit.brandNameScrollWidth <= headerAudit.brandNameWidth + 1, item.family + ": brand name must not be clipped");
    assert.ok(headerAudit.brandRoleScrollWidth <= headerAudit.brandRoleWidth + 1, item.family + ": role must not be clipped");
    assert.ok(Math.abs(headerAudit.langTop - headerAudit.brandTop) <= 4, item.family + ": language switcher must align with the brand row");
  } else {
    assert.equal(headerAudit.caseBarDisplay, "flex", item.family + ": back link and language selector must remain in one row");
    assert.equal(headerAudit.caseBarFlexWrap, "nowrap", item.family + ": compact case header must not wrap");
    assert.ok(headerAudit.caseBarScrollWidth <= headerAudit.caseBarClientWidth + 1, item.family + ": case header must not overflow");
    assert.ok(headerAudit.backLinkScrollWidth <= headerAudit.backLinkWidth + 1, item.family + ": back link text must not be clipped");
    assert.ok(Math.abs(headerAudit.langTop - headerAudit.backTop) <= 4, item.family + ": language selector must align with the back link");
    assert.ok(afterHeight <= 60, item.family + ": compact case header must be at most 60px high");
  }
  const reduction = beforeHeight - afterHeight;
  report.headers.push({ page: item.family, viewport: 390, beforeHeight, afterHeight, reduction, ...headerAudit });
  if (item.kind === "brand") {
    assert.ok(reduction >= 40, item.family + ": header must be at least 40px shorter at 390px, measured " + reduction + "px");
  } else {
    assert.ok(reduction > 0, item.family + ": case header must be shorter on mobile");
  }
  await afterPage.close();

  const beforeWide = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await ready(beforeWide, item.before);
  const beforeWideHeight = await beforeWide.locator(headerSelector).evaluate(el => Math.round(el.getBoundingClientRect().height));
  await beforeWide.close();
  const afterWide = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await ready(afterWide, item.after, true);
  const afterWideHeight = await afterWide.locator(headerSelector).evaluate(el => Math.round(el.getBoundingClientRect().height));
  assert.ok(Math.abs(beforeWideHeight - afterWideHeight) <= 1, item.family + ": header at 1280px must remain unchanged");
  report.headers.push({ page: item.family, viewport: 1280, beforeHeight: beforeWideHeight, afterHeight: afterWideHeight, reduction: beforeWideHeight - afterWideHeight });
  await afterWide.close();
}

const whatsappPages = [
  { route: "/index.html", name: "home PT" },
  { route: "/en/index.html", name: "home EN" },
  { route: "/case_study_02_leadtime_final.html", name: "case PT" },
  { route: "/en/cases/case-02-lead-time-governance.html", name: "case EN" },
  { route: "/projeto-assistente-virtual.html", name: "project PT" },
  { route: "/en/project-virtual-assistant.html", name: "project EN" },
  { route: "/privacidade.html", name: "privacy PT" },
  { route: "/en/privacy.html", name: "privacy EN" }
];
for (const item of whatsappPages) {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    await ready(page, LOCAL + item.route, true);
    const scrollTarget = await page.evaluate(() => {
      const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const maxScroll = Math.max(0, documentHeight - innerHeight);
      const threshold = Math.min(documentHeight * 0.35, 600);
      return { documentHeight, maxScroll, threshold, target: maxScroll < threshold ? maxScroll : threshold };
    });
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
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        fabSize: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fab-size")),
        href: el.href
      };
    });
    if (scrollTarget.maxScroll > 0) {
      assert.equal(initial.visibility, "hidden", item.name + " " + width + "px: WhatsApp must be hidden at the top");
      assert.equal(initial.opacity, "0", item.name + " " + width + "px: hidden state must be transparent");
      assert.equal(initial.tabIndex, -1, item.name + " " + width + "px: hidden WhatsApp must not receive keyboard focus");
      assert.equal(initial.ariaHidden, "true", item.name + " " + width + "px: hidden WhatsApp must be removed from the accessibility tree");
    } else {
      assert.equal(initial.visibility, "visible", item.name + " " + width + "px: a page with no scroll is already at its end");
    }
    assert.equal(initial.background, "rgb(37, 211, 102)", item.name + " " + width + "px: WhatsApp brand color must remain unchanged");
    assert.equal(initial.width, initial.fabSize, item.name + " " + width + "px: WhatsApp width must remain --fab-size");
    assert.equal(initial.height, initial.fabSize, item.name + " " + width + "px: WhatsApp height must remain --fab-size");
    assert.ok(initial.href.startsWith("https://wa.me/"), item.name + " " + width + "px: WhatsApp destination must remain wa.me");

    if (scrollTarget.maxScroll > 0) {
      await page.evaluate(target => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, target);
      }, scrollTarget.target);
      await page.waitForFunction(() => {
        const el = document.querySelector(".sticky-cta");
        return el && getComputedStyle(el).visibility === "visible" && getComputedStyle(el).opacity === "1";
      }, null, { timeout: 5000 });
    }
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
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        href: el.href
      };
    });
    assert.equal(after.visibility, "visible", item.name + " " + width + "px: WhatsApp must appear at the scroll threshold or page end");
    assert.equal(after.opacity, "1", item.name + " " + width + "px: visible state must be opaque");
    assert.equal(after.tabIndex, 0, item.name + " " + width + "px: visible WhatsApp must be keyboard accessible");
    assert.equal(after.ariaHidden, "false", item.name + " " + width + "px: visible WhatsApp must be exposed to assistive technology");
    assert.equal(after.background, initial.background, item.name + " " + width + "px: WhatsApp color must remain unchanged");
    assert.equal(after.width, initial.width, item.name + " " + width + "px: WhatsApp size must remain unchanged");
    assert.equal(after.height, initial.height, item.name + " " + width + "px: WhatsApp size must remain unchanged");
    assert.equal(after.left, initial.left, item.name + " " + width + "px: WhatsApp horizontal position must remain fixed");
    assert.equal(after.top, initial.top, item.name + " " + width + "px: WhatsApp vertical position must remain fixed");
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
    report.whatsapp.push({ page: item.name, viewport: width, ...scrollTarget, initial, after });
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
  await ready(page, LOCAL + "/" + route, true);
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
    return { title, links, uniqueDestinations: new Set(links.map(link => link.href)).size, primaryCount, nextButtonCount, ordered, allLabel, heading };
  }, { id, heading, allLabel });
  assert.equal(audit.title, heading, route + ": combined projects block heading mismatch");
  assert.equal(audit.links.length, 4, route + ": projects block must contain four links");
  assert.equal(audit.uniqueDestinations, 4, route + ": project navigation must not duplicate destinations");
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
