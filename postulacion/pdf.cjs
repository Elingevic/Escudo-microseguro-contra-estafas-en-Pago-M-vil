// Uso: node pdf.cjs <entrada.html> <salida.pdf> <horizontal|vertical>
// Genera el PDF con Chromium y una vista previa PNG de cada página.
let pw; try { pw = require("playwright"); } catch { pw = require("@playwright/test"); }
const path = require("path");
const [entrada, salida, orientacion] = process.argv.slice(2);
const horizontal = orientacion === "horizontal";
const W = horizontal ? 1123 : 794, H = horizontal ? 794 : 1123;
(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1.5 });
  await page.goto("file:///" + path.resolve(__dirname, entrada).replace(/\\/g, "/"));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  await page.pdf({ path: path.resolve(__dirname, salida), width: horizontal ? "297mm" : "210mm", height: horizontal ? "210mm" : "297mm", printBackground: true, preferCSSPageSize: true });
  const hojas = await page.$$(".hoja, .pagina");
  for (let i = 0; i < hojas.length; i++) await hojas[i].screenshot({ path: path.resolve(__dirname, `vista-${path.basename(entrada, ".html")}-${i + 1}.png`) });
  const desbordes = await page.$$eval(".hoja, .pagina", (hs) => hs.map((h, i) => (h.scrollHeight > h.clientHeight + 1 ? i + 1 : 0)).filter(Boolean));
  // contenido que invade el pie
  const choques = await page.$$eval(".pagina", (ps) => ps.map((p, i) => { const pie = p.querySelector(".pie"); if (!pie) return 0; const lim = pie.getBoundingClientRect().top; const max = Math.max(...[...p.children].filter(c => c !== pie).map(c => c.getBoundingClientRect().bottom)); return max > lim - 2 ? i + 1 : 0; }).filter(Boolean));
  console.log(`PDF: ${salida} · ${hojas.length} página(s)` + (desbordes.length ? ` · ⚠ desborde en ${desbordes.join(", ")}` : " · sin desbordes") + (choques.length ? ` · ⚠ choca con el pie en ${choques.join(", ")}` : ""));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
