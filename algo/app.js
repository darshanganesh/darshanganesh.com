function loadAll(cb) {
  Promise.all([
    fetch("data.json?" + Date.now()).then(r => r.json()),
    fetch("aggressive_data.json?" + Date.now()).then(r => r.json())
  ]).then(([def, agg]) => cb(def, agg))
    .catch(e => console.error("load failed:", e));
}
function loadDef(cb) { fetch("data.json?" + Date.now()).then(r => r.json()).then(cb).catch(e => console.error(e)); }
function loadAgg(cb) { fetch("aggressive_data.json?" + Date.now()).then(r => r.json()).then(cb).catch(e => console.error(e)); }

function fmt$(v, d) {
  d = d || 0;
  var neg = v < 0;
  var s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return (neg ? "-$" : "$") + s;
}
function pct(v) { return (v >= 0 ? "+" : "") + v.toFixed(2) + "%"; }
function scoreColor(s) {
  if (s >= 55) return "#3fb950";
  if (s >= 45) return "#f0c000";
  if (s >= 30) return "#f09000";
  return "#f85149";
}

function drawChart(history, svgId, series) {
  var svg = document.getElementById(svgId);
  if (!svg || !history || history.length === 0) return;
  var W = 760, H = 200, P = { l: 48, r: 16, t: 16, b: 28 };
  var ys = history.flatMap(function(r) { return series.map(function(s) { return r[s[0]] || 0; }); }).concat([0]);
  var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
  var pad = (hi - lo) * 0.2 || 2; lo -= pad; hi += pad;
  var X = function(i) { return P.l + (history.length > 1 ? i / (history.length - 1) : 0.5) * (W - P.l - P.r); };
  var Y = function(v) { return P.t + (hi - v) / (hi - lo) * (H - P.t - P.b); };
  var s = "";
  for (var k = 0; k <= 4; k++) {
    var v = lo + (hi - lo) * k / 4;
    s += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--border)" stroke-width="0.5"/>';
    s += '<text x="' + (P.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="10" fill="var(--muted)" font-family="monospace">' + v.toFixed(1) + '%</text>';
  }
  if (lo < 0 && hi > 0) s += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="var(--muted)" stroke-width="0.8" stroke-dasharray="4 3"/>';
  history.forEach(function(r, i) {
    s += '<text x="' + X(i) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="10" fill="var(--muted)" font-family="monospace">' + r.date.slice(5) + '</text>';
  });
  series.forEach(function(sr) {
    var key = sr[0], col = sr[1], glow = sr[2] || "transparent";
    var pts = history.map(function(r, i) { return X(i) + "," + Y(r[key] || 0); }).join(" ");
    s += '<polygon fill="' + glow + '" points="' + X(0) + ',' + Y(0) + ' ' + pts + ' ' + X(history.length - 1) + ',' + Y(0) + '"/>';
    s += '<polyline fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" points="' + pts + '"/>';
    history.forEach(function(r, i) {
      s += '<circle cx="' + X(i) + '" cy="' + Y(r[key] || 0) + '" r="3" fill="' + col + '" stroke="var(--surface)" stroke-width="1.5"/>';
    });
  });
  svg.innerHTML = s;
}

function drawEquityCurve(history, svgId) {
  var svg = document.getElementById(svgId);
  if (!svg || !history || history.length === 0) return;
  var W = 760, H = 200, P = { l: 48, r: 16, t: 16, b: 28 };
  var vals = history.map(function(h) { return h.equity; });
  var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
  if (mn === mx) { mn -= 100; mx += 100; }
  var rng = mx - mn;
  var X = function(i) { return P.l + (history.length > 1 ? i / (history.length - 1) : 0.5) * (W - P.l - P.r); };
  var Y = function(v) { return P.t + (1 - (v - mn) / rng) * (H - P.t - P.b); };
  var start = history[0].equity, end = history[history.length - 1].equity;
  var col = end >= start ? "#3fb950" : "#f85149";
  var pts = history.map(function(r, i) { return X(i) + "," + Y(r.equity); }).join(" ");
  var s = '<defs><linearGradient id="eq-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + col + '" stop-opacity="0.3"/><stop offset="100%" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
  s += '<polygon fill="url(#eq-g)" points="' + X(0) + ',' + Y(mn) + ' ' + pts + ' ' + X(history.length - 1) + ',' + Y(mn) + '"/>';
  s += '<polyline fill="none" stroke="' + col + '" stroke-width="2" points="' + pts + '"/>';
  history.forEach(function(r, i) { s += '<circle cx="' + X(i) + '" cy="' + Y(r.equity) + '" r="3" fill="' + col + '"/>'; });
  for (var k = 0; k <= 4; k++) {
    var v = mn + rng * (1 - k / 4);
    var ly = P.t + k / 4 * (H - P.t - P.b);
    s += '<text x="' + (P.l - 6) + '" y="' + (ly + 4) + '" text-anchor="end" fill="var(--muted)" font-size="10" font-family="monospace">$' + (v / 1000).toFixed(1) + 'k</text>';
    s += '<line x1="' + P.l + '" y1="' + ly + '" x2="' + (W - P.r) + '" y2="' + ly + '" stroke="var(--border)" stroke-width="0.5"/>';
  }
  svg.innerHTML = s;
}
