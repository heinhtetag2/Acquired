import { chromium, devices } from "playwright";
const b = await chromium.launch();
for (const p of process.argv.slice(2)) {
  const ctx = await b.newContext({ ...devices["Moto G4"] });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => { window.__lcp = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lcp.push({ t: Math.round(e.startTime), size: e.size, el: e.element ? e.element.outerHTML.slice(0, 160) : "", url: e.url }))).observe({ type: "largest-contentful-paint", buffered: true });
    window.__cls = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && window.__cls.push({ v: e.value.toFixed(3), t: Math.round(e.startTime), src: (e.sources || []).map((s) => s.node ? (s.node.className || s.node.nodeName) + "" : "").join("|") }))).observe({ type: "layout-shift", buffered: true }); });
  await page.goto("http://localhost:3200/" + p, { waitUntil: "load" });
  await page.waitForTimeout(6000);
  console.log("==", p || "home");
  console.log(JSON.stringify(await page.evaluate(() => ({ lcp: window.__lcp, cls: window.__cls })), null, 1));
  const res = await page.evaluate(() => performance.getEntriesByType("resource").filter(r => /image|img|font|css/.test(r.initiatorType + r.name)).map(r => `${Math.round(r.startTime)}-${Math.round(r.responseEnd)} ${Math.round(r.transferSize/1024)}k ${r.name.replace(location.origin,"")}`).slice(0, 25));
  console.log(res.join("\n"));
  await ctx.close();
}
await b.close();
