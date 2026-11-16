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

async function verifyRegressionDetection(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.setContent(
    '<main><p style="font-size:16px;color:#777;background:#888">Contrast regression probe</p></main>'
  );
  const broken = await runContrastRule(page);
  assert.ok(
    broken.violations.length > 0,
    "The validator self-test must detect deliberately insufficient contrast."
  );

  await page.locator("p").evaluate((element) => {
    element.style.color = "#000";
    element.style.backgroundColor = "#fff";
  });
  const restored = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: "rule", values: ["color-contrast"] }
    });
    return result.violations;
  });
  assert.equal(
    restored.length,
    0,
    "The validator self-test must pass after the contrast regression is reverted."
  );
  await page.close();
  return { regression_detected: true, after_revert: "pass" };
}

await mkdir(OUTPUT, { recursive: true });
const pages = (await walk(ROOT))
  .map((file) => "/" + path.relative(ROOT, file).split(path.sep).join("/"))
  .sort();

if (!pages.length) throw new Error("No generated HTML pages found in _site.");

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
