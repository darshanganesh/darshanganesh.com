function loadData(cb) {
  fetch("data.json")
    .then(r => r.json())
    .then(cb)
    .catch(e => console.error("loadData failed:", e));
}

function fmt$(v, d) {
  d = d || 0;
  const neg = v < 0;
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return (neg ? "-$" : "$") + s;
}

function pct(v) {
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

function scoreColor(s) {
  if (s >= 55) return "#3fb950";
  if (s >= 45) return "#f0c000";
  if (s >= 30) return "#f09000";
  return "#f85149";
}

function drawEquityCurve(history, svgId) {
  var svg = document.getElementById(svgId);
  if (!svg || !history || history.length === 0) return;

  var w = 760, h = 200, px = 40, py = 20;
  var vals = history.map(function(h) { return h.equity; });
  var mn = Math.min.apply(null, vals);
  var mx = Math.max.apply(null, vals);
  if (mn === mx) { mn -= 100; mx += 100; }
  var rng = mx - mn;

  var pts = history.map(function(pt, i) {
    var x = px + (history.length === 1 ? (w - 2 * px) / 2 : i / (history.length - 1) * (w - 2 * px));
    var y = py + (1 - (pt.equity - mn) / rng) * (h - 2 * py);
    return x + "," + y;
  });

  var start = history[0].equity;
  var end = history[history.length - 1].equity;
  var col = end >= start ? "#3fb950" : "#f85149";

  var gradId = "eq-grad";
  var inner = '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">';
  inner += '<stop offset="0%" stop-color="' + col + '" stop-opacity="0.3"/>';
  inner += '<stop offset="100%" stop-color="' + col + '" stop-opacity="0"/>';
  inner += '</linearGradient></defs>';

  var areaPath = "M" + pts[0] + " L" + pts.join(" L") + " L" + (px + (history.length - 1) / (history.length - 1 || 1) * (w - 2 * px)) + "," + (h - py) + " L" + px + "," + (h - py) + " Z";
  inner += '<path d="' + areaPath + '" fill="url(#' + gradId + ')"/>';
  inner += '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + col + '" stroke-width="2"/>';

  history.forEach(function(pt, i) {
    var x = px + (history.length === 1 ? (w - 2 * px) / 2 : i / (history.length - 1) * (w - 2 * px));
    var y = py + (1 - (pt.equity - mn) / rng) * (h - 2 * py);
    inner += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + col + '"/>';
  });

  // Y-axis labels
  for (var i = 0; i <= 4; i++) {
    var v = mn + rng * (1 - i / 4);
    var ly = py + i / 4 * (h - 2 * py);
    inner += '<text x="' + (px - 4) + '" y="' + (ly + 4) + '" text-anchor="end" fill="#8b949e" font-size="10" font-family="monospace">$' + (v / 1000).toFixed(1) + 'k</text>';
    inner += '<line x1="' + px + '" y1="' + ly + '" x2="' + (w - px) + '" y2="' + ly + '" stroke="#30363d" stroke-width="0.5"/>';
  }

  svg.innerHTML = inner;
}
