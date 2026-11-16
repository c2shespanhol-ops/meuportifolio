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
        if (t.wrapperWidth === null || t.wrapperWidth > viewport.width + 1 || t.wrapperScrollWidth <= t.wrapperClientWidth || t.tableWidth < 679) {
          failures.push(route + " @ " + viewport.width + "px: metrics table is not safely scrollable/readable " + JSON.stringify(result));
        }
      }
      if (route === "/index.html" || route === "/en/index.html") {
        const image = await page.locator(".about-photo img").first().evaluate(el => ({complete:el.complete,naturalWidth:el.naturalWidth})).catch(() => null);
        const fallback = await page.locator(".about-photo .photo-fallback-mark").count();
        if ((!image || !image.complete || image.naturalWidth === 0) && !fallback) {
          failures.push(route + " @ " + viewport.width + "px: profile image did not load and no fallback exists");
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
