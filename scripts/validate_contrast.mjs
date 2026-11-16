import assert from "node:assert/strict";
import { chromium } from "playwright";
import * as axeModule from "axe-core";
import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("_site");
const OUTPUT = path.resolve("artifacts/contrast-audit");
const BASE_URL = "http://127.0.0.1:8765";
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1280, height: 900 }
];
const axeSource = axeModule.default?.source ?? axeModule.source;

if (!axeSource) throw new Error("Could not load axe-core source.");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".html") ? [full] : [];
  }));
  return nested.flat();
}

async function runContrastRule(page) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: "rule", values: ["color-contrast"] }
    });
    return {
      violations: result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary
        }))
      })),
      incomplete: result.incomplete
        .filter((item) => item.id === "color-contrast")
        .map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => ({
            target: node.target,
            html: node.html?.slice(0, 600) ?? "",
            summary: node.failureSummary ?? "",
            any: (node.any ?? []).map((check) => ({
              id: check.id,
              message: check.message,
              data: check.data
            })),
            all: (node.all ?? []).map((check) => ({
              id: check.id,
              message: check.message,
              data: check.data
            })),
            none: (node.none ?? []).map((check) => ({
              id: check.id,
              message: check.message,
              data: check.data
            }))
          }))
        }))
    };
  });
}

function parseRgb(value) {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
  if (parts.length < 3 || parts.slice(0,3).some((part) => !Number.isFinite(part))) return null;
  return parts.slice(0,3);
}

function relativeLuminance(rgb) {
  const channels = rgb.map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const fg = parseRgb(foreground);
  const bg = parseRgb(background);
  if (!fg || !bg) return null;
  const first = relativeLuminance(fg);
  const second = relativeLuminance(bg);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function readFocusedStyle(locator) {
  return locator.evaluate((element) => {
    function opaqueBackground(node) {
      let current = node;
      while (current) {
        const value = getComputedStyle(current).backgroundColor;
        const match = value.match(/rgba?\(([^)]+)\)/i);
        if (match) {
          const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
          const alpha = parts.length > 3 ? parts[3] : 1;
          if (alpha >= 0.98) return value;
        }
        current = current.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    }
    const style = getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      foreground: style.color,
      background: opaqueBackground(element),
      text: (element.innerText || element.getAttribute("aria-label") || "").trim().slice(0, 100),
      selector: element.matches("a.skip") ? "a.skip" : "button"
    };
  });
}

async function auditFocusStates(page, route, viewport) {
  const failures = [];
  let skipChecks = 0;
  let buttonChecks = 0;
  await page.keyboard.press("Tab");

  const skip = page.locator("a.skip").first();
  if (await skip.count()) {
    await skip.focus();
    const state = await readFocusedStyle(skip);
    skipChecks += 1;
    const ratio = contrastRatio(state.foreground, state.background);
    if (!state.focusVisible || ratio === null || ratio < 4.5) {
      failures.push({
        route,
        viewport: viewport.width,
        state: "skip:focus-visible",
        ratio,
        details: state
      });
    }
  }

  const buttons = page.locator("button:visible:not([disabled])");
  const count = await buttons.count();
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    await button.focus();
    const state = await readFocusedStyle(button);
    buttonChecks += 1;
    const ratio = contrastRatio(state.foreground, state.background);
    if (!state.focusVisible || ratio === null || ratio < 4.5) {
      failures.push({
        route,
        viewport: viewport.width,
        state: "button:focus-visible",
        ratio,
        details: state
      });
    }
  }
  return { failures, skipChecks, buttonChecks };
}

async function verifyRegressionDetection(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.setContent(`
    <style>
      a.skip{position:absolute;top:-80px;left:12px;padding:12px 16px;color:#777;background:#888}
      a.skip:focus-visible{top:12px}
    </style>
    <a class="skip" href="#main">Pular para o conteúdo</a>
    <main id="main"><button type="button">Ação</button></main>
  `);

  const broken = await auditFocusStates(page, "/self-test", { width: 390 });
  const skipRegressionDetected = broken.failures.some((failure) =>
    failure.state === "skip:focus-visible" && failure.ratio !== null && failure.ratio < 4.5
  );
  assert.ok(
    skipRegressionDetected,
    "The contrast validator must detect a deliberately bad focused skip-link color."
  );

  await page.locator("a.skip").evaluate((element) => {
    element.style.color = "#14100A";
    element.style.backgroundColor = "#A88F5B";
    element.style.top = "12px";
  });
  const restored = await auditFocusStates(page, "/self-test", { width: 390 });
  assert.equal(
    restored.failures.length,
    0,
    "The validator self-test must pass after the skip-link contrast regression is reverted."
  );
  await page.close();
  return {
    skip_regression_detected: true,
    after_revert: "pass"
  };
}

await mkdir(OUTPUT, { recursive: true });
const pages = (await walk(ROOT))
  .map((file) => "/" + path.relative(ROOT, file).split(path.sep).join("/"))
  .sort();

if (!pages.length) throw new Error("No generated HTML pages found in _site.");

const skipPages = [];
for (const route of pages) {
  const html = await readFile(path.join(ROOT, route.replace(/^\//, "")), "utf8");
  if (/<a\b[^>]*class=["'][^"']*\bskip\b/i.test(html)) skipPages.push(route);
}


async function resolveMetaRefresh(route) {
  const file = path.join(ROOT, route.replace(/^\//, ""));
  const html = await readFile(file, "utf8");
  const match = html.match(/<meta\b[^>]*http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url\s*=\s*([^;"']+)/i)
    || html.match(/<meta\b[^>]*content=["'][^"']*url\s*=\s*([^;"']+)["'][^>]*http-equiv=["']?refresh["']?/i);
  if (!match) return route;
  const target = match[1].trim();
  if (/^(https?:)?\/\//i.test(target)) return new URL(target, BASE_URL).pathname;
  return path.posix.resolve(path.posix.dirname(route), target);
}

const browser = await chromium.launch({ headless: true });
const failures = [];
const results = [];
const incompleteNodeDetails = [];
let checked = 0;
let incompleteCount = 0;
let skipFocusChecks = 0;
let buttonFocusChecks = 0;

try {
  const selfTest = await verifyRegressionDetection(browser);

  for (const route of pages) {
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport });
      try {
        const auditRoute = await resolveMetaRefresh(route);
        const response = await page.goto(BASE_URL + auditRoute, {
          waitUntil: "networkidle",
          timeout: 30000
        });
        if (!response || !response.ok()) {
          failures.push({ route, viewport: viewport.width, error: "page_load_failed" });
          continue;
        }

        const audit = await runContrastRule(page);
        const focusAudit = await auditFocusStates(page, route, viewport);
        skipFocusChecks += focusAudit.skipChecks;
        buttonFocusChecks += focusAudit.buttonChecks;
        if (focusAudit.failures.length) failures.push(...focusAudit.failures);
        checked += 1;
        const routeIncompleteNodes = audit.incomplete.flatMap((item) =>
          item.nodes.map((node) => ({ route, viewport: viewport.width, ...node }))
        );
        incompleteNodeDetails.push(...routeIncompleteNodes);
        incompleteCount += routeIncompleteNodes.length;

        if (audit.violations.length) {
          failures.push({
            route,
            viewport: viewport.width,
            violations: audit.violations
          });
        }

        results.push({
          route,
          viewport: viewport.width,
          violations: audit.violations.reduce((sum, item) => sum + item.nodes.length, 0),
          incomplete: routeIncompleteNodes.length
        });

        if (routeIncompleteNodes.length) {
          const screenshotName = route.replace(/^\//, "").replace(/[^a-zA-Z0-9_-]+/g, "_")
            + "-" + viewport.width + ".png";
          await page.screenshot({
            path: path.join(OUTPUT, screenshotName),
            fullPage: true
          });
        }
      } catch (error) {
        failures.push({ route, viewport: viewport.width, error: error.message });
      } finally {
        await page.close();
      }
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    standard: "WCAG 2.1 AA color-contrast",
    thresholds: { normal_text: "4.5:1", large_text: "3:1" },
    viewport_widths: VIEWPORTS.map((item) => item.width),
    pages: pages.length,
    page_viewport_checks: checked,
    incomplete_nodes: incompleteCount,
    incomplete_node_details: incompleteNodeDetails,
    focus_state_checks: {
      skip_pages: skipPages.length,
      skip_links: skipFocusChecks,
      buttons: buttonFocusChecks
    },
    screenshot_scope: "Every route/viewport with axe color-contrast incomplete nodes",
    self_test: selfTest,
    failures,
    results
  };

  await writeFile(
    path.join(OUTPUT, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  console.log(JSON.stringify({
    pages: pages.length,
    viewport_widths: VIEWPORTS.map((item) => item.width),
    checks: checked,
    failures: failures.length,
    incomplete_nodes: incompleteCount,
    focus_state_checks: { skip_pages: skipPages.length, skip_links: skipFocusChecks, buttons: buttonFocusChecks },
    self_test: selfTest,
    evidence: OUTPUT
  }, null, 2));

  if (failures.length) {
    console.error("WCAG color contrast audit failed. See artifacts/contrast-audit/report.json.");
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
