// Shared CSS + arrow helper for the HLD diagrams. Each diagram is a self-contained HTML page
// rendered to PNG with Playwright (see render-diagrams.js).
const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#fff;font-family:Inter,"Segoe UI",Arial,sans-serif;color:#1F2937;-webkit-font-smoothing:antialiased}
#canvas{position:relative;width:1000px;padding:14px 14px 10px 14px;background:#fff}
#overlay{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.box{position:relative;border:1.5px solid #8A94A6;border-radius:7px;background:#F1F3F6;padding:8px 10px;line-height:1.25}
.box .t{font-weight:600;font-size:12.5px;color:#1F2A44}
.box .s{font-size:10.5px;color:#4B5563;margin-top:3px}
.box .s b{color:#1F2A44;font-weight:600}
.blue{background:#E8F0FB;border-color:#3B6DB3}.blue .t{color:#1F3F7A}
.green{background:#E6F4EE;border-color:#2E8B6C}.green .t{color:#1B5E45}
.grey{background:#F1F3F6;border-color:#8A94A6}
.orange{background:#FDEFE4;border-color:#E07A2E}.orange .t{color:#9A4A12}
.purple{background:#F1EAF9;border-color:#7B4FB0}.purple .t{color:#4E2A86}
.navy{background:#16294A;border-color:#16294A;color:#fff}.navy .t{color:#fff}.navy .s{color:#C9D3E3}.navy .s b,.teal .s b{color:#fff}
.teal{background:#0F4C5C;border-color:#0F4C5C;color:#fff}.teal .t{color:#fff}.teal .s{color:#CFE3E8}
.lbl{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#1B5E45;margin-bottom:6px}
.lbl.blue{background:none;border:none;color:#1F3F7A}.lbl.grey{background:none;border:none;color:#4B5563}
.note{font-size:9.5px;color:#6B7280;text-align:center;margin-top:8px}
.band{border-radius:7px;padding:8px 12px;text-align:center}
.band .t{font-weight:700;font-size:12px}
.band .s{font-size:10px;margin-top:2px}
.col{display:flex;flex-direction:column;gap:10px}
.row{display:flex;gap:10px}
.lane{display:flex;align-items:stretch;border-top:1px solid #E5E7EB}
.lane:last-child{border-bottom:1px solid #E5E7EB}
.lane .name{width:120px;flex:none;background:#16294A;color:#fff;font-weight:600;font-size:11.5px;display:flex;align-items:center;justify-content:center;text-align:center;padding:8px;border-radius:5px;margin:4px 0}
.lane .body{flex:1;position:relative;min-height:70px;padding:10px 8px;background:#FAFBFC}
.lane:nth-child(even) .body{background:#fff}
.num{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:9px;background:#16294A;color:#fff;font-size:10px;font-weight:700;margin-right:5px;vertical-align:middle}
.chip{display:inline-block;font-family:"DejaVu Sans Mono",Consolas,monospace;font-size:9px;border:1px solid #2E8B6C;color:#1B5E45;border-radius:4px;padding:0 4px;background:#fff}
.small{font-size:10px;color:#4B5563}
.dim{color:#6B7280}
`;

const JS = `
function connect(a, b, o) {
  o = o || {};
  const svg = document.getElementById('overlay');
  const canvas = document.getElementById('canvas').getBoundingClientRect();
  const A = document.querySelector(a).getBoundingClientRect();
  const B = document.querySelector(b).getBoundingClientRect();
  function pt(r, side, off) {
    off = off || 0;
    const x0 = r.left - canvas.left, y0 = r.top - canvas.top;
    switch (side) {
      case 'right': return [x0 + r.width, y0 + r.height / 2 + off];
      case 'left': return [x0, y0 + r.height / 2 + off];
      case 'top': return [x0 + r.width / 2 + off, y0];
      case 'bottom': return [x0 + r.width / 2 + off, y0 + r.height];
    }
  }
  const fs = o.from || 'bottom', ts = o.to || 'top';
  const [x1, y1] = pt(A, fs, o.fromOff), [x2, y2] = pt(B, ts, o.toOff);
  const color = o.color || '#16294A';
  let d;
  if (o.straight) d = 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2;
  else if ((fs === 'bottom' || fs === 'top') && (ts === 'top' || ts === 'bottom')) {
    const ym = o.mid != null ? o.mid : (y1 + y2) / 2;
    d = 'M' + x1 + ' ' + y1 + ' L' + x1 + ' ' + ym + ' L' + x2 + ' ' + ym + ' L' + x2 + ' ' + y2;
  } else if ((fs === 'left' || fs === 'right') && (ts === 'left' || ts === 'right')) {
    const xm = o.mid != null ? o.mid : (x1 + x2) / 2;
    d = 'M' + x1 + ' ' + y1 + ' L' + xm + ' ' + y1 + ' L' + xm + ' ' + y2 + ' L' + x2 + ' ' + y2;
  } else if (fs === 'bottom' || fs === 'top') {
    d = 'M' + x1 + ' ' + y1 + ' L' + x1 + ' ' + y2 + ' L' + x2 + ' ' + y2;
  } else {
    d = 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y1 + ' L' + x2 + ' ' + y2;
  }
  const id = 'm' + Math.random().toString(36).slice(2, 8);
  const defs = svg.querySelector('defs') || svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
  defs.insertAdjacentHTML('beforeend',
    '<marker id="' + id + '" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">' +
    '<path d="M0 0 L8 4 L0 8 z" fill="' + color + '"/></marker>');
  svg.insertAdjacentHTML('beforeend',
    '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + (o.width || 1.6) + '"' +
    (o.dash ? ' stroke-dasharray="5 4"' : '') + (o.noHead ? '' : ' marker-end="url(#' + id + ')"') + '/>');
  if (o.label) {
    const lx = o.lx != null ? o.lx : (x1 + x2) / 2, ly = o.ly != null ? o.ly : (y1 + y2) / 2;
    const w = o.label.length * 5.6 + 10;
    svg.insertAdjacentHTML('beforeend',
      '<rect x="' + (lx - w / 2) + '" y="' + (ly - 8) + '" width="' + w + '" height="15" rx="3" fill="#fff" stroke="' + color + '" stroke-width="0.8"/>' +
      '<text x="' + lx + '" y="' + (ly + 3) + '" text-anchor="middle" font-size="9.5" font-weight="600" fill="' + color + '" font-family="Inter,Arial">' + o.label + '</text>');
  }
}
`;

function page(body, script = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
<body><div id="canvas">${body}<svg id="overlay"></svg></div>
<script>${JS}
window.addEventListener('load', () => { ${script} });
</script></body></html>`;
}
module.exports = { page };
