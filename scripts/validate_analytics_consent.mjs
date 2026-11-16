import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
try {
 const page = await browser.newPage();
 const requests = [];
 page.on("request", request => { if (/googletagmanager\.com|google-analytics\.com|cdn\.counter\.dev/i.test(request.url())) requests.push(request.url()); });
 await page.goto("http://127.0.0.1:8765/", { waitUntil: "domcontentloaded" });
 await page.evaluate(() => localStorage.removeItem("portfolio-analytics-consent"));
 await page.reload({ waitUntil: "domcontentloaded" });
 await page.waitForTimeout(1200);
 assert.equal(requests.length, 0, "No analytics request may occur before consent.");
 assert.equal(await page.locator(".privacy-consent").count(), 1);
 assert.ok(await page.getByRole("button", { name: "Aceitar" }).isVisible());
 assert.ok(await page.getByRole("button", { name: "Rejeitar" }).isVisible());
 await page.getByRole("button", { name: "Aceitar" }).click();
 await page.waitForTimeout(1200);
 assert.ok(requests.some(url => url.includes("googletagmanager.com/gtag/js")), "Accept must load configured GA4.");
 assert.equal(await page.evaluate(() => localStorage.getItem("portfolio-analytics-consent")), "accepted");
 await page.evaluate(() => localStorage.setItem("portfolio-analytics-consent", "rejected"));
 requests.length = 0;
 await page.reload({ waitUntil: "domcontentloaded" });
 await page.waitForTimeout(1200);
 assert.equal(requests.length, 0, "Reject must block analytics requests.");
 assert.equal(await page.locator(".privacy-consent").count(), 0);
 console.log("Analytics consent test passed: no requests before consent or after rejection; acceptance enables GA4.");
} finally { await browser.close(); }
