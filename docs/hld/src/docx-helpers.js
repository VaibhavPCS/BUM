// Styling helpers that reproduce the look of IFMS-DG-ACC-005 in Word.
const fs = require('fs');
const path = require('path');
const {
  Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, AlignmentType, BorderStyle,
  ShadingType, WidthType, HeightRule, TableLayoutType, VerticalAlign, PageBreak, TabStopType,
  PageNumber, Footer, Header, LevelFormat,
} = require('docx');

const C = {
  navy: '14243F', navyText: '1F2A44', green: '1F7A5C', greenDark: '1B5E45', greenBorder: '2E8B6C',
  blue: '2F5FA8', blueDark: '1F3F7A', grey: '6B7280', greyText: '4B5563', line: 'E5E7EB',
  zebra: 'F5F7FA', orange: 'D9671E', purple: '6B3FA0', red: 'B42318', white: 'FFFFFF',
};
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 1134, CONTENT_W = PAGE_W - 2 * MARGIN; // 9638
const FONT = 'Calibri', MONO = 'Consolas';

const noBorder = { style: BorderStyle.NONE, size: 0, color: C.white };
const NO_BORDERS = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder };
const line = (color = C.line, size = 4) => ({ style: BorderStyle.SINGLE, size, color });

// ---------- inline markup: **bold**, ~~italic~~, {{chip}}, [[Badge]] ----------
const BADGES = {
  Critical: { fill: 'FDECEC', color: C.red }, High: { fill: 'FDF1E3', color: 'B45309' },
  Medium: { fill: 'E8EFFB', color: '2F5FA8' }, Low: { fill: 'EEF0F3', color: '4B5563' },
  Proposed: { fill: 'F1EAF9', color: C.purple }, Approved: { fill: 'E6F4EE', color: C.greenDark },
  Open: { fill: 'FDECEC', color: C.red }, Default: { fill: 'FDF1E3', color: 'B45309' },
  Sync: { fill: 'E8EFFB', color: '2F5FA8' }, Event: { fill: 'E6F4EE', color: C.greenDark },
  'Phase 1': { fill: 'E6F4EE', color: C.greenDark }, 'Phase 2': { fill: 'EEF0F3', color: '4B5563' },
  Deferred: { fill: 'EEF0F3', color: '4B5563' },
};
function runs(text, base = {}) {
  const out = [];
  const re = /\*\*(.+?)\*\*|~~(.+?)~~|\{\{(.+?)\}\}|\[\[(.+?)\]\]/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ ...base, text: text.slice(last, m.index) }));
    if (m[1] !== undefined) out.push(new TextRun({ ...base, text: m[1], bold: true }));
    else if (m[2] !== undefined) out.push(new TextRun({ ...base, text: m[2], italics: true }));
    else if (m[3] !== undefined) out.push(new TextRun({
      ...base, text: '\u00a0' + m[3].replace(/-/g, '\u2011').replace(/ /g, '\u00a0') + '\u00a0', font: MONO, size: Math.max((base.size || 20) - 5, 14), color: C.greenDark,
      shading: { type: ShadingType.CLEAR, fill: 'EEF6F1', color: 'auto' },
      border: { style: BorderStyle.SINGLE, size: 4, color: C.greenBorder, space: 1 },
    }));
    else if (m[4] !== undefined) {
      const b = BADGES[m[4]] || BADGES.Low;
      out.push(new TextRun({ ...base, text: ' ' + m[4] + ' ', bold: true, size: Math.max((base.size || 20) - 4, 14), color: b.color,
        shading: { type: ShadingType.CLEAR, fill: b.fill, color: 'auto' } }));
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(new TextRun({ ...base, text: text.slice(last) }));
  return out;
}

// ---------- paragraphs ----------
function P(text, o = {}) {
  const base = { size: o.size || 20, color: o.color || C.navyText, bold: o.bold, font: o.font };
  return new Paragraph({
    children: typeof text === 'string' ? runs(text, base) : text,
    alignment: o.align, keepNext: o.keepNext, keepLines: o.keepLines,
    spacing: { before: o.before ?? 0, after: o.after ?? 120, line: o.line ?? 276 },
    indent: o.indent, border: o.border, shading: o.shading, pageBreakBefore: o.pageBreakBefore,
  });
}
function small(text, o = {}) { return P(text, { size: 16, color: C.grey, after: 80, ...o }); }
function spacer(after = 60) { return new Paragraph({ spacing: { before: 0, after }, children: [] }); }
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }

function partHeading(title, intro) {
  const out = [new Paragraph({
    pageBreakBefore: true, keepNext: true,
    spacing: { before: 0, after: 120 },
    border: { bottom: { color: C.green, space: 6, style: BorderStyle.SINGLE, size: 12 } },
    children: [new TextRun({ text: title, bold: true, size: 40, color: C.navyText })],
  })];
  if (intro) out.push(P(intro, { size: 20, color: C.greyText, after: 200, keepNext: true }));
  return out;
}
function H2(code, title, o = {}) {
  return new Paragraph({
    keepNext: true, spacing: { before: o.before ?? 320, after: 120 },
    border: o.rule ? { top: { color: C.line, space: 10, style: BorderStyle.SINGLE, size: 4 } } : undefined,
    children: [
      new TextRun({ text: code + '  ', bold: true, size: 28, color: C.green }),
      new TextRun({ text: title, bold: true, size: 28, color: C.navyText }),
    ],
  });
}
function H3(title) {
  return new Paragraph({ keepNext: true, spacing: { before: 220, after: 80 },
    children: [new TextRun({ text: title, bold: true, size: 22, color: C.navyText })] });
}
function bullets(items, o = {}) {
  return items.map(t => new Paragraph({
    numbering: { reference: o.numbered ? 'numbers' : 'bullets', level: 0 },
    spacing: { before: 0, after: o.after ?? 60, line: 276 },
    children: runs(t, { size: o.size || 20, color: o.color || C.navyText }),
  }));
}

// ---------- callouts ----------
const KINDS = {
  simple: { label: 'IN SIMPLE WORDS', border: C.green, fill: 'EEF6F3', labelColor: C.greenDark },
  why: { label: 'WHY', border: C.greenBorder, fill: 'EAF5EE', labelColor: C.greenDark },
  alt: { label: 'ALTERNATIVES CONSIDERED', border: '8A94A6', fill: 'F3F4F6', labelColor: C.greyText },
  dev: { label: 'DEVELOPER NOTE', border: '8A94A6', fill: 'F3F4F6', labelColor: C.greyText },
  watch: { label: 'WATCH OUT', border: C.orange, fill: 'FDF3E7', labelColor: 'B45309' },
  signoff: { label: 'NEEDS SIGN-OFF', border: C.purple, fill: 'F3EEF9', labelColor: C.purple },
  decision: { label: 'DECISION', border: C.blue, fill: 'EAF1FB', labelColor: C.blueDark },
  example: { label: 'EXAMPLE', border: C.blue, fill: 'EAF1FB', labelColor: C.blueDark },
};
function callout(kind, blocks, labelOverride) {
  const k = KINDS[kind];
  const children = [new Paragraph({ spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: labelOverride || k.label, bold: true, size: 15, color: k.labelColor, characterSpacing: 30 })] })];
  for (const b of blocks) {
    if (typeof b === 'string') children.push(P(b, { after: 80, size: 20 }));
    else if (b.bullets) children.push(...bullets(b.bullets, { after: 40 }));
    else if (b.table) children.push(b.table, spacer(40));
    else if (b.raw) children.push(b.raw);
  }
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W], layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: k.fill, color: 'auto' },
      borders: { top: noBorder, bottom: noBorder, right: noBorder, left: { style: BorderStyle.SINGLE, size: 24, color: k.border } },
      margins: { top: 120, bottom: 60, left: 200, right: 160 },
      children,
    })] })],
  });
}

// ---------- tables ----------
function cellContent(v, o) {
  if (v && v.raw) return v.raw;
  if (Array.isArray(v)) return v.map(t => P(t, { size: o.size, after: 40, line: 260, color: o.color }));
  return [P(String(v ?? ''), { size: o.size, after: 0, line: 260, color: o.color, bold: o.bold, align: o.align })];
}
function table(cols, rows, o = {}) {
  // cols: [{ w: twips, h: 'Header', align? }]
  const total = cols.reduce((s, c) => s + c.w, 0);
  const size = o.size || 18;
  const header = new TableRow({ tableHeader: true, cantSplit: true, children: cols.map(c => new TableCell({
    width: { size: c.w, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: o.headerFill || C.navy, color: 'auto' },
    borders: NO_BORDERS, margins: { top: 70, bottom: 70, left: 100, right: 100 }, verticalAlign: VerticalAlign.CENTER,
    children: cellContent(c.h, { size, color: C.white, bold: true, align: c.align }),
  })) });
  const body = rows.map((r, i) => new TableRow({ cantSplit: true, children: r.map((v, j) => new TableCell({
    width: { size: cols[j].w, type: WidthType.DXA },
    shading: o.zebra !== false && i % 2 === 1 ? { type: ShadingType.CLEAR, fill: C.zebra, color: 'auto' } : undefined,
    borders: { top: noBorder, left: noBorder, right: noBorder, bottom: line(C.line, 4) },
    margins: { top: 60, bottom: 60, left: 100, right: 100 }, verticalAlign: VerticalAlign.TOP,
    children: cellContent(v, { size, align: cols[j].align, bold: o.boldFirst && j === 0 }),
  })) }));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: cols.map(c => c.w),
    layout: TableLayoutType.FIXED, borders: NO_BORDERS, rows: [header, ...body] });
}

// label/value card (used for decisions and sign-off items)
function card(title, badge, rows, o = {}) {
  const lw = o.labelWidth || 1900, vw = CONTENT_W - lw;
  const head = new TableRow({ cantSplit: true, children: [new TableCell({
    columnSpan: 2, width: { size: CONTENT_W, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: 'EEF1F5', color: 'auto' },
    borders: { top: line('C7CDD8', 6), bottom: noBorder, left: noBorder, right: noBorder },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ spacing: { before: 0, after: 0 }, tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W - 260 }],
      children: [...runs(title, { size: 20, bold: true, color: C.navyText }), new TextRun({ text: '\t' }), ...runs(badge, { size: 18 })] })],
  })] });
  const body = rows.map(([k, v]) => new TableRow({ cantSplit: true, children: [
    new TableCell({ width: { size: lw, type: WidthType.DXA }, borders: { top: noBorder, left: noBorder, right: noBorder, bottom: line() },
      margins: { top: 60, bottom: 60, left: 120, right: 80 }, children: [P(k, { size: 17, color: C.grey, after: 0, line: 260 })] }),
    new TableCell({ width: { size: vw, type: WidthType.DXA }, borders: { top: noBorder, left: noBorder, right: noBorder, bottom: line() },
      margins: { top: 60, bottom: 60, left: 80, right: 120 }, children: cellContent(v, { size: 18 }) }),
  ] }));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [lw, vw], layout: TableLayoutType.FIXED,
    borders: NO_BORDERS, rows: [head, ...body] });
}

// stat tiles
function tiles(items) {
  const w = Math.floor(CONTENT_W / items.length);
  return new Table({ width: { size: w * items.length, type: WidthType.DXA }, columnWidths: items.map(() => w), layout: TableLayoutType.FIXED,
    borders: NO_BORDERS, rows: [new TableRow({ cantSplit: true, children: items.map(([n, t]) => new TableCell({
      width: { size: w, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: 'EEF6F3', color: 'auto' },
      borders: { top: noBorder, bottom: noBorder, right: { style: BorderStyle.SINGLE, size: 24, color: C.white }, left: { style: BorderStyle.SINGLE, size: 24, color: C.green } },
      margins: { top: 100, bottom: 100, left: 160, right: 100 },
      children: [new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: n, bold: true, size: 32, color: C.navyText })] }),
        P(t, { size: 16, color: C.greyText, after: 0, line: 240 })],
    })) })] });
}

// figure
function figure(file, caption, o = {}) {
  const p = path.resolve(__dirname, '..', 'diagrams', file);
  const data = fs.readFileSync(p);
  // PNG header: width at byte 16, height at 20
  const w = data.readUInt32BE(16), h = data.readUInt32BE(20);
  const widthPx = o.widthPx || 642; // content width at 96 dpi
  const heightPx = Math.round(widthPx * h / w);
  const [bold, rest] = caption.includes('. ') ? [caption.slice(0, caption.indexOf('. ') + 1), caption.slice(caption.indexOf('. ') + 1)] : [caption, ''];
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 80 },
      children: [new ImageRun({ type: 'png', data, transformation: { width: widthPx, height: heightPx } })] }),
    new Paragraph({ spacing: { before: 0, after: 200 }, children: [
      new TextRun({ text: bold, bold: true, size: 17, color: C.navyText }), ...runs(rest, { size: 17, color: C.greyText })] }),
  ];
}

// two-column borderless layout
function twoCol(left, right) {
  const w = Math.floor(CONTENT_W / 2);
  return new Table({ width: { size: w * 2, type: WidthType.DXA }, columnWidths: [w, w], layout: TableLayoutType.FIXED, borders: NO_BORDERS,
    rows: [new TableRow({ cantSplit: true, children: [left, right].map(ch => new TableCell({ width: { size: w, type: WidthType.DXA }, borders: NO_BORDERS,
      margins: { top: 0, bottom: 0, left: 0, right: 200 }, children: ch })) })] });
}

function footer(text) {
  return new Footer({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    border: { top: { color: C.line, space: 4, style: BorderStyle.SINGLE, size: 4 } },
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text, size: 15, color: C.grey }),
      new TextRun({ children: ['\tPage ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], size: 15, color: C.grey })],
  })] });
}

const numbering = { config: [
  { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 420, hanging: 240 } }, run: { color: C.navyText } } }] },
  { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 420, hanging: 300 } } } }] },
] };

module.exports = { C, PAGE_W, PAGE_H, MARGIN, CONTENT_W, FONT, MONO, NO_BORDERS, noBorder, line, runs, P, small, spacer, pageBreak,
  partHeading, H2, H3, bullets, callout, table, card, tiles, figure, twoCol, footer, numbering };
