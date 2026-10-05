const CFG = require('./config');

const round = (x, d = 2) => (Number.isFinite(x) ? +x.toFixed(d) : null);

function linearFit(pts) {
  const n = pts.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (const { x, y } of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; syy += y * y; }
  const den = n * sxx - sx * sx;
  if (n < 2 || den === 0) return { slope: 0, r2: 0 };
  const slope = (n * sxy - sx * sy) / den;
  const icpt = (sy - slope * sx) / n;
  const ssTot = syy - (sy * sy) / n;
  let ssRes = 0;
  for (const { x, y } of pts) ssRes += (y - (slope * x + icpt)) ** 2;
  return { slope, r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot };
}

function compensate(pGaugeKPa, tempC, tRefC = CFG.system.tRefC, atm = CFG.system.atmKPa) {
  const pAbs = pGaugeKPa + atm;
  return pAbs * ((tRefC + 273.15) / (tempC + 273.15)) - atm;
}

module.exports = { round, linearFit, compensate };
