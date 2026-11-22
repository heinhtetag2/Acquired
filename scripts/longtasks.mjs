import { chromium } from "playwright";
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36" }); const cdp = await page.context().newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await page.addInitScript(() => { window.__lt = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(Math.round(e.startTime) + "+" + Math.round(e.duration)))).observe({ type: "longtask", buffered: true }); });
await page.goto("http://localhost:3200/" + (process.argv[2] || "episodes"), { waitUntil: "load" }); await page.waitForTimeout(12000);
console.log(await page.evaluate(() => ({ lt: window.__lt, nodes: document.getElementsByTagName("*").length, imgs: document.images.length })));
await b.close();
