import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const siteRoot = path.resolve("_site");
const evidenceDir = path.resolve("artifacts/privacy-consent");
mkdirSync(evidenceDir, { recursive: true });

function collectHtml(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtml(fullPath);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".html") ? [fullPath] : [];
  });
}
const htmlFiles = collectHtml(siteRoot);
assert.ok(htmlFiles.length > 0, "The generated site must contain HTML pages.");
const pages = htmlFiles.map(file => ({ file: path.relative(siteRoot, file).split(path.sep).join("/"), html: readFileSync(file, "utf8") }));
const pagesWithConsent = pages.filter(page => /<script\b[^>]*src=["'][^"']*privacy-consent\.js(?:\?[^"']*)?["'][^>]*>/i.test(page.html));
const pagesWithPrivacyLinks = pages.filter(page => /class=["'][^"']*privacy-footer-links[^"']*["']/i.test(page.html));
if (pagesWithConsent.length !== htmlFiles.length) {
  const missing = pages.filter(page => !/<script\b[^>]*src=["'][^"']*privacy-consent\.js(?:\?[^"']*)?["'][^>]*>/i.test(page.html)).map(page => page.file);
  console.error("Pages missing privacy-consent.js:", missing.join(", "));
}
assert.equal(pagesWithConsent.length, htmlFiles.length, "Every HTML page must load privacy-consent.js.");
assert.equal(pagesWithPrivacyLinks.length, htmlFiles.length, "Every HTML page must contain privacy links in its footer.");
for (const page of pages) {
  const english = page.file.startsWith("en/") || /<html\b[^>]*\blang=["']en/i.test(page.html);
  assert.ok(page.html.includes(english ? "Privacy preferences" : "Preferências de privacidade"), `Missing language-specific preferences link: ${page.file}`);
  assert.ok(page.html.includes(english ? ">Privacy<" : ">Privacidade<"), `Missing language-specific privacy link: ${page.file}`);
  const scriptMatch = page.html.match(/<script\b[^>]*src=["']([^"']*privacy-consent\.js(?:\?[^"']*)?)["'][^>]*>/i);
  assert.ok(scriptMatch, `Missing consent script: ${page.file}`);
  const scriptPath = path.posix.normalize(path.posix.join(path.posix.dirname(page.file), scriptMatch[1].split("?")[0]));
  assert.equal(scriptPath, "privacy-consent.js", `Consent script path is incorrect: ${page.file} -> ${scriptPath}`);
  const privacyMatch = page.html.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>\s*(?:Privacy|Privacidade)\s*<\/a>/i);
  assert.ok(privacyMatch, `Missing privacy policy destination: ${page.file}`);
  const policyPath = path.posix.normalize(path.posix.join(path.posix.dirname(page.file), privacyMatch[1].split(/[?#]/)[0]));
  assert.equal(policyPath, english ? "en/privacy.html" : "privacidade.html", `Privacy link path is incorrect: ${page.file} -> ${policyPath}`);
}
const ptPolicy = readFileSync(path.join(siteRoot, "privacidade.html"), "utf8");
const enPolicy = readFileSync(path.join(siteRoot, "en/privacy.html"), "utf8");
assert.match(ptPolicy, /currículo em PDF[\s\S]*telefone e e-mail/i);
assert.match(ptPolicy, /link wa\.me[\s\S]*abre uma conversa/i);
assert.match(enPolicy, /resume PDF[\s\S]*phone number and email address/i);
assert.match(enPolicy, /wa\.me link[\s\S]*opens a conversation/i);

const browser = await chromium.launch({ headless: true });
const analyticsPattern = /googletagmanager\.com|google-analytics\.com|counter\.dev/i;
const networkLog = [];
try {
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  const mobileRequests = [];
  mobilePage.on("request", request => { if (analyticsPattern.test(request.url())) mobileRequests.push(request.url()); });
  await mobilePage.goto("http://127.0.0.1:8765/", { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1200);
  assert.equal(mobileRequests.length, 0, "No analytics request may occur before consent.");
  assert.equal(await mobilePage.locator(".privacy-consent").count(), 1);
  assert.ok(await mobilePage.getByRole("button", { name: "Aceitar" }).isVisible());
  assert.ok(await mobilePage.getByRole("button", { name: "Rejeitar" }).isVisible());
  await mobilePage.locator(".privacy-consent button").first().focus();
  const focusVisible = await mobilePage.evaluate(() => { const el = document.activeElement; return !!el && el.matches(".privacy-consent button") && getComputedStyle(el).outlineStyle !== "none" && parseFloat(getComputedStyle(el).outlineWidth) >= 2; });
  assert.ok(focusVisible, "Consent controls must expose a visible keyboard focus.");
  const mobileButtonSizes = await mobilePage.locator(".privacy-consent-actions button").evaluateAll(buttons => buttons.map(button => ({ height: button.getBoundingClientRect().height, width: button.getBoundingClientRect().width })));
  assert.ok(mobileButtonSizes.every(size => size.height >= 44), "Consent buttons must have a 44px minimum target.");
  assert.equal(mobileButtonSizes[0].width, mobileButtonSizes[1].width, "Accept and reject buttons must have equal visual width.");
  const floatingOverlap = await mobilePage.evaluate(() => {
    const banner = document.querySelector(".privacy-consent").getBoundingClientRect();
    return [".sticky-cta", ".to-top"].map(selector => {
      const control = document.querySelector(selector);
      if (!control) return { selector, present: false, overlaps: false };
      const rect = control.getBoundingClientRect();
      return { selector, present: true, overlaps: !(rect.right <= banner.left || rect.left >= banner.right || rect.bottom <= banner.top || rect.top >= banner.bottom) };
    });
  });
  assert.ok(floatingOverlap.every(item => !item.overlaps), "Floating WhatsApp and back-to-top controls must remain outside the consent banner.");
  networkLog.push("Floating controls: no overlap with consent banner at 390px.");
  await mobilePage.screenshot({ path: path.join(evidenceDir, "consent-390.png") });
  networkLog.push("390px before consent: 0 analytics requests.");

  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  const desktopRequests = [];
  desktopPage.on("request", request => { if (analyticsPattern.test(request.url())) desktopRequests.push(request.url()); });
  await desktopPage.goto("http://127.0.0.1:8765/", { waitUntil: "domcontentloaded" });
  await desktopPage.waitForTimeout(1200);
  assert.equal(desktopRequests.length, 0, "No analytics request may occur before consent on desktop.");
  assert.equal(await desktopPage.locator(".privacy-consent").count(), 1);
  await desktopPage.screenshot({ path: path.join(evidenceDir, "consent-1280.png") });
  networkLog.push("1280px before consent: 0 analytics requests.");

  await mobilePage.getByRole("button", { name: "Aceitar" }).click();
  await mobilePage.waitForTimeout(1500);
  assert.ok(mobileRequests.some(url => analyticsPattern.test(url)), "Accept must load the configured analytics provider.");
  networkLog.push("After accept: " + mobileRequests.map(url => new URL(url).hostname).join(", "));

  await mobilePage.getByRole("link", { name: "Preferências de privacidade" }).click();
  assert.equal(await mobilePage.locator(".privacy-consent").count(), 1, "The footer preference link must reopen the consent panel.");
  const afterPreferenceReject = [];
  // Start observing before the click so requests during the old document's unload
  // and the subsequent navigation are included in the rejection assertion.
  mobilePage.on("request", request => { if (analyticsPattern.test(request.url())) afterPreferenceReject.push(request.url()); });
  const urlBeforeReject = mobilePage.url();
  await mobilePage.getByRole("button", { name: "Rejeitar" }).click();
  await mobilePage.waitForTimeout(1500);
  assert.equal(mobilePage.url(), urlBeforeReject, "Rejecting consent must not reload the document and flush pending analytics beacons.");
  assert.equal(await mobilePage.evaluate(() => localStorage.getItem("portfolio-analytics-consent")), "rejected", "The rejected choice must persist immediately.");
  assert.equal(await mobilePage.evaluate(() => window["ga-disable-" + window.PORTFOLIO_GA4_MEASUREMENT_ID]), true, "GA4 collection must be synchronously disabled after rejection.");
  networkLog.push("Requests observed after preference rejection without document reload: " + JSON.stringify(afterPreferenceReject));
  writeFileSync(path.join(evidenceDir, "network-log.txt"), networkLog.join("\\n") + "\\n", "utf8");
  assert.equal(afterPreferenceReject.length, 0, "No analytics request may occur after rejecting consent.");
  networkLog.push("After preference rejection: 0 analytics requests; document remained loaded.");
  const afterReaccept = [];
  mobilePage.on("request", request => { if (analyticsPattern.test(request.url())) afterReaccept.push(request.url()); });
  await mobilePage.getByRole("link", { name: "Preferências de privacidade" }).click();
  await mobilePage.getByRole("button", { name: "Aceitar" }).click();
  await mobilePage.waitForTimeout(1500);
  assert.equal(await mobilePage.evaluate(() => localStorage.getItem("portfolio-analytics-consent")), "accepted");
  assert.ok(afterReaccept.length > 0, "Accepting again through preferences must reactivate analytics.");
  networkLog.push("After changing rejected to accepted: " + afterReaccept.map(url => new URL(url).hostname).join(", "));


  const rejectContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const rejectPage = await rejectContext.newPage();
  const rejectRequests = [];
  rejectPage.on("request", request => { if (analyticsPattern.test(request.url())) rejectRequests.push(request.url()); });
  await rejectPage.goto("http://127.0.0.1:8765/", { waitUntil: "domcontentloaded" });
  await rejectPage.waitForTimeout(800);
  await rejectPage.getByRole("button", { name: "Rejeitar" }).click();
  await rejectPage.waitForTimeout(1200);
  assert.equal(rejectRequests.length, 0, "Reject must block all analytics requests.");
  assert.equal(await rejectPage.locator(".privacy-consent").count(), 0);
  networkLog.push("390px after reject: 0 analytics requests.");

  const englishContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const englishPage = await englishContext.newPage();
  const englishRequests = [];
  englishPage.on("request", request => { if (analyticsPattern.test(request.url())) englishRequests.push(request.url()); });
  await englishPage.goto("http://127.0.0.1:8765/en/", { waitUntil: "domcontentloaded" });
  await englishPage.waitForTimeout(800);
  await englishPage.screenshot({ path: path.join(evidenceDir, "consent-en-390.png") });
  assert.ok(await englishPage.getByRole("button", { name: "Accept" }).isVisible());
  assert.ok(await englishPage.getByRole("button", { name: "Reject" }).isVisible());
  assert.equal(englishRequests.length, 0, "English pages must also block analytics before consent.");
  networkLog.push("English page before consent: 0 analytics requests.");

  writeFileSync(path.join(evidenceDir, "network-log.txt"), networkLog.join("\n") + "\n", "utf8");
  console.log(`Privacy coverage: ${pagesWithConsent.length}/${htmlFiles.length} pages load the consent script; ${pagesWithPrivacyLinks.length}/${htmlFiles.length} pages have footer privacy links.`);
  console.log(networkLog.join("\n"));
  console.log("Analytics consent tests passed at 390px and 1280px, including acceptance, rejection, preference changes and English copy.");
  await Promise.all([mobileContext.close(), desktopContext.close(), rejectContext.close(), englishContext.close()]);
} finally {
  await browser.close();
}
