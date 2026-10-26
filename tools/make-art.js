// Erzeugt die Lounge-Grafiken (SVG, Club-Penguin-Stil) nach public/img/lounge/
// Aufruf: node tools/make-art.js   (Zufall ist fest geseedet -> immer gleiches Bild)
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'public', 'img', 'lounge');
fs.mkdirSync(OUT, { recursive: true });

let seed = 20061025;
function rnd() {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (a) => a[Math.floor(rnd() * a.length)];
const f = (n) => Math.round(n * 10) / 10;
const K = '#1d1410'; // Konturfarbe
const st = (w = 2, c = K) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

function save(name, body, defs = '', css = '') {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">\n' +
    (defs || css ? `<defs>${defs}${css ? `<style>${css}</style>` : ''}</defs>\n` : '') + body + '\n</svg>\n';
  fs.writeFileSync(path.join(OUT, name + '.svg'), svg);
  console.log(name.padEnd(12), (svg.length / 1024).toFixed(1) + ' KB');
}

// Gemeinsame Animationen
const CSS_FLAME = '.fl1,.fl2,.fl3,.cfl{transform-box:fill-box;transform-origin:50% 100%}' +
  '.fl1{animation:fa .9s ease-in-out infinite alternate}.fl2{animation:fb .7s ease-in-out infinite alternate}' +
  '.fl3{animation:fa .5s ease-in-out infinite alternate}.cfl{animation:fb .6s ease-in-out infinite alternate}' +
  '@keyframes fa{0%{transform:scale(1,1) skewX(0)}50%{transform:scale(1.05,.9) skewX(3deg)}100%{transform:scale(.96,1.08) skewX(-3deg)}}' +
  '@keyframes fb{0%{transform:scale(.95,1.06) skewX(-2deg)}100%{transform:scale(1.04,.92) skewX(4deg)}}';
const CSS_TW = '.tw{animation:tw 2.6s ease-in-out infinite}@keyframes tw{0%,100%{opacity:1}50%{opacity:.3}}';
const CSS_GLOW = '.glow{animation:gl 2.2s ease-in-out infinite alternate}@keyframes gl{from{opacity:.65}to{opacity:1}}';
const CSS_STEAM = '.steam path{animation:sm 2.4s ease-in-out infinite;opacity:0}.steam path:nth-child(2){animation-delay:-.8s}.steam path:nth-child(3){animation-delay:-1.6s}' +
  '@keyframes sm{0%{opacity:0;transform:translateY(4px)}40%{opacity:.75}100%{opacity:0;transform:translateY(-9px)}}';
const glowGrad = (id, col, a = 0.55) => `<radialGradient id="${id}"><stop offset="0" stop-color="${col}" stop-opacity="${a}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;

function candle(x, y, h = 12, col = '#f6ecd2') {
  return `<rect x="${x - 3}" y="${y - h}" width="6" height="${h}" rx="1" fill="${col}" ${st(1.2)}/>` +
    `<circle cx="${x}" cy="${y - h - 4}" r="7" fill="url(#cglow)" class="glow"/>` +
    `<path class="cfl" d="M${x},${y - h - 9} C${x + 3},${y - h - 5} ${x + 3},${y - h - 1} ${x},${y - h - 1} C${x - 3},${y - h - 1} ${x - 3},${y - h - 5} ${x},${y - h - 9} Z" fill="#ffc53a" ${st(0.8, '#b8560c')}/>`;
}
function steam(x, y) {
  return `<g class="steam" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round">` +
    `<path d="M${x - 3},${y} C${x - 6},${y - 4} ${x},${y - 6} ${x - 3},${y - 10}"/>` +
    `<path d="M${x + 1},${y} C${x - 2},${y - 4} ${x + 4},${y - 6} ${x + 1},${y - 10}"/>` +
    `<path d="M${x + 4},${y} C${x + 1},${y - 4} ${x + 7},${y - 6} ${x + 4},${y - 10}"/></g>`;
}
function mug(x, y, col, h = 12) { // x,y = Mitte unten
  return `<path d="M${x + 5},${y - h + 3} C${x + 10},${y - h + 3} ${x + 10},${y - 3} ${x + 5},${y - 3}" fill="none" ${st(1.8)}/>` +
    `<rect x="${x - 6}" y="${y - h}" width="12" height="${h}" rx="2" fill="${col}" ${st(1.4)}/>` +
    `<ellipse cx="${x}" cy="${y - h + .5}" rx="5" ry="1.6" fill="#7a4020"/>` +
    `<rect x="${x - 3}" y="${y - h - 1.5}" width="2.6" height="2.6" fill="#fff"/><rect x="${x + .5}" y="${y - h - 2}" width="2.6" height="2.6" fill="#ffd9e6"/>`;
}

// ============================ HINTERGRUND ============================
function bg() {
  const defs =
    '<linearGradient id="wallg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#922d3a"/><stop offset="1" stop-color="#6c1d28"/></linearGradient>' +
    '<pattern id="paper" width="28" height="34" patternUnits="userSpaceOnUse"><rect width="14" height="34" fill="#000" opacity=".07"/>' +
    '<path d="M21,10 L24.5,15 L21,20 L17.5,15 Z" fill="#eab94f" opacity=".38"/><circle cx="7" cy="27" r="1.4" fill="#eab94f" opacity=".3"/></pattern>' +
    '<linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1636"/><stop offset="1" stop-color="#2e5590"/></linearGradient>' +
    '<linearGradient id="aur" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5cf2a6" stop-opacity="0"/><stop offset=".5" stop-color="#6cf7c0" stop-opacity=".55"/><stop offset="1" stop-color="#7a9cff" stop-opacity="0"/></linearGradient>' +
    '<clipPath id="glass"><rect x="42" y="50" width="126" height="98"/></clipPath>' +
    '<linearGradient id="fshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +
    glowGrad('fireglow', '#ffb04a', 0.5) + glowGrad('lampglow', '#ffe08a', 0.6) + glowGrad('cglow', '#ffd36a', 0.7) +
    '<pattern id="scarf" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" fill="#d23a3a"/><rect y="3" width="10" height="3" fill="#f4eee0"/></pattern>';
  const css = CSS_TW + CSS_GLOW + CSS_FLAME +
    '.snow1{animation:fall 10s linear infinite}.snow2{animation:fall 6.5s linear infinite}@keyframes fall{from{transform:translateY(0)}to{transform:translateY(100px)}}' +
    '.aurora{animation:au 7s ease-in-out infinite alternate}@keyframes au{from{opacity:.35;transform:translateX(-6px)}to{opacity:.9;transform:translateX(6px)}}' +
    '.fglow{animation:gl 1.6s ease-in-out infinite alternate}';
  let s = '';

  // --- Wand ---
  s += '<rect width="600" height="194" fill="url(#wallg)"/><rect width="600" height="128" fill="url(#paper)"/>';
  s += '<rect y="132" width="600" height="56" fill="#7a4320"/>';
  for (let x = 6; x < 600; x += 56) {
    s += `<rect x="${x}" y="141" width="48" height="38" rx="2" fill="#6a381a" ${st(1.2, '#45220d')}/>` +
      `<path d="M${x + 2},177 V143 H${x + 46}" fill="none" stroke="#93582d" stroke-width="1.2"/>`;
  }
  s += `<rect y="125" width="600" height="8" fill="#5a2e14" ${st(1.2)}/><rect y="126.5" width="600" height="2" fill="#8d5429"/>`;
  s += `<rect y="184" width="600" height="10" fill="#4f2a12" ${st(1.2)}/><rect y="185.5" width="600" height="2" fill="#714020"/>`;
  s += `<rect width="600" height="11" fill="#4a2a14"/><path d="M0,4 H600 M0,7.5 H600" stroke="#5e371a" stroke-width="1" stroke-dasharray="40 14 70 20"/><path d="M0,11 H600" ${st(1.6)}/>`;

  // --- Fenster mit Nachtlandschaft ---
  s += `<rect x="34" y="42" width="142" height="114" rx="3" fill="#f1e4cc" ${st(2)}/>`;
  s += '<g clip-path="url(#glass)"><rect x="42" y="50" width="126" height="98" fill="url(#night)"/>';
  for (let i = 0; i < 24; i++) s += `<circle class="tw" style="animation-delay:-${f(rnd() * 3)}s" cx="${f(44 + rnd() * 122)}" cy="${f(52 + rnd() * 52)}" r="${f(0.5 + rnd() * 0.9)}" fill="#fff"/>`;
  s += '<path class="aurora" d="M42,80 C70,60 92,88 120,66 C140,52 156,72 168,60 L168,76 C150,88 140,72 120,86 C92,104 70,78 42,98 Z" fill="url(#aur)"/>';
  s += '<circle cx="146" cy="68" r="17" fill="#fff6c8" opacity=".22"/><circle cx="146" cy="68" r="10" fill="#fff6d2"/><circle cx="142.5" cy="66" r="2" fill="#ece0a6"/><circle cx="149" cy="71.5" r="1.5" fill="#ece0a6"/>';
  s += '<path d="M42,122 C62,110 84,112 106,122 C128,132 146,114 168,116 V150 H42 Z" fill="#bcd3ee"/>';
  for (const [x, y, h] of [[58, 124, 16], [70, 121, 20], [128, 126, 15], [154, 120, 19], [162, 124, 13]]) {
    s += `<path d="M${x},${y - h} L${x + h * .4},${y} L${x - h * .4},${y} Z" fill="#1d3a5e"/><path d="M${x},${y - h} L${x + h * .16},${y - h * .6} L${x - h * .16},${y - h * .6} Z" fill="#fff"/>`;
  }
  s += '<path d="M42,134 C70,126 98,138 126,131 C146,127 158,133 168,131 V150 H42 Z" fill="#f0f7ff"/>';
  const flakes = (n, a, b) => {
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = f(44 + rnd() * 122), y = f(50 + rnd() * 100), r = f(a + rnd() * (b - a));
      out += `<circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x}" cy="${f(y - 100)}" r="${r}"/>`;
    }
    return out;
  };
  s += `<g class="snow1" fill="#fff" opacity=".8">${flakes(28, 0.6, 1.2)}</g><g class="snow2" fill="#fff">${flakes(12, 1.3, 2.1)}</g>`;
  s += '<path d="M48,96 L64,54 L71,54 L55,96 Z M110,146 L124,104 L128,104 L114,146 Z" fill="#fff" opacity=".1"/></g>';
  s += `<rect x="42" y="50" width="126" height="98" fill="none" ${st(1.4)}/>`;
  s += `<rect x="103" y="50" width="4" height="98" fill="#f1e4cc" ${st(1.1)}/><rect x="42" y="97" width="126" height="4" fill="#f1e4cc" ${st(1.1)}/>`;
  s += '<path d="M44,146 C52,141 62,143 70,146 Z M140,146 C148,142 158,141 166,146 Z" fill="#fff"/>';
  s += `<rect x="24" y="152" width="162" height="8" rx="1.5" fill="#efe0c4" ${st(1.6)}/>`;
  // Schneemann + Kerze auf der Fensterbank
  s += `<circle cx="62" cy="146" r="5.5" fill="#fff" ${st(1.2)}/><circle cx="62" cy="137" r="4" fill="#fff" ${st(1.2)}/>` +
    `<rect x="58.5" y="129" width="7" height="4" fill="#2a2a2a" ${st(1)}/><rect x="56.5" y="132.5" width="11" height="1.6" fill="#2a2a2a"/>` +
    '<path d="M62,137.5 L66.5,138.5 L62,139.2 Z" fill="#f0841c"/><circle cx="60.6" cy="136" r=".7" fill="#222"/><circle cx="63.4" cy="136" r=".7" fill="#222"/>' +
    '<path d="M58,141 H66 L66,142.6 H58 Z M64,141 L66,146 L64.5,146 Z" fill="#d23a3a"/>';
  s += candle(150, 152, 11, '#f3e1c0');

  // Vorhaenge
  const curtain = '<path d="M20,40 L58,40 C56,62 52,96 40,124 C46,140 50,160 53,186 L13,186 C16,160 22,140 25,124 C18,96 18,62 20,40 Z" fill="#b42634" ' + st(1.7) + '/>' +
    '<path d="M26,44 C25,70 28,100 32,122 M42,44 C42,70 38,98 35,122 M28,130 C25,150 22,168 21,184 M38,130 C41,150 44,168 46,184" fill="none" stroke="#7f1824" stroke-width="2"/>' +
    '<path d="M50,44 C49,66 46,92 38,118" fill="none" stroke="#d6505f" stroke-width="2"/>' +
    `<ellipse cx="33" cy="125" rx="11" ry="4.5" fill="#e2b13c" ${st(1.4)}/><path d="M33,129 L30,140 L36,140 Z" fill="#e2b13c" ${st(1)}/>`;
  s += curtain + `<g transform="translate(210,0) scale(-1,1)">${curtain}</g>`;
  s += `<rect x="6" y="29" width="198" height="5" rx="2" fill="#d4a62a" ${st(1.3)}/><circle cx="6" cy="31.5" r="4.5" fill="#e2b13c" ${st(1.3)}/><circle cx="204" cy="31.5" r="4.5" fill="#e2b13c" ${st(1.3)}/>`;
  let val = 'M12,34 L198,34 L198,48';
  for (let x = 198; x > 12; x -= 31) val += ` Q${f(x - 15.5)},62 ${f(x - 31)},48`;
  s += `<path d="${val} Z" fill="#9e1f2c" ${st(1.7)}/><path d="M12,38 H198" stroke="#e2b13c" stroke-width="2.5"/>`;
  for (let x = 198 - 15.5; x > 12; x -= 31) s += `<circle cx="${f(x)}" cy="58" r="2.4" fill="#e2b13c" ${st(1)}/>`;

  // Bilderrahmen links, Gemaelde rechts, Wandlampen, Schalbrett
  s += `<rect x="198" y="44" width="24" height="30" rx="1" fill="#d4a43a" ${st(1.4)}/><rect x="201.5" y="47.5" width="17" height="23" fill="#a9d8f2"/>` +
    '<path d="M201.5,64 C206,60 214,60 218.5,64 V70.5 H201.5 Z" fill="#fff"/><ellipse cx="210" cy="61" rx="4.5" ry="6.5" fill="#1897d3"/><ellipse cx="211" cy="62.5" rx="2.6" ry="4.2" fill="#fff"/><path d="M211,56 L214,57.5 L211,58.5 Z" fill="#f7a21b"/>';
  s += `<rect x="378" y="28" width="48" height="38" rx="1" fill="#d4a43a" ${st(1.6)}/><rect x="383" y="33" width="38" height="28" fill="#bfe6ff"/>` +
    '<circle cx="412" cy="40" r="4" fill="#ffe27a"/><rect x="383" y="51" width="38" height="10" fill="#2f6fae"/>' +
    `<path d="M388,52 L396,40 L402,44 L408,36 L416,52 Z" fill="#fff" ${st(1)}/><path d="M396,40 L399,52 M408,36 L406,52" stroke="#cfe3f5" stroke-width="1.2"/>`;
  const sconce = (x, y) => `<circle class="glow" cx="${x}" cy="${y - 2}" r="26" fill="url(#lampglow)"/>` +
    `<rect x="${x - 3}" y="${y + 4}" width="6" height="12" rx="2" fill="#c79a32" ${st(1.2)}/><path d="M${x},${y + 6} V${y - 1}" ${st(2.2)}/>` +
    `<path d="M${x - 8},${y - 10} C${x - 8},${y + 1} ${x + 8},${y + 1} ${x + 8},${y - 10} C${x + 4},${y - 7} ${x - 4},${y - 7} ${x - 8},${y - 10} Z" fill="#fde7a6" ${st(1.4)}/>` +
    `<ellipse cx="${x}" cy="${y - 4}" rx="3" ry="3.5" fill="#fffbe0"/>`;
  s += sconce(210, 104) + sconce(402, 100);
  s += `<circle cx="583" cy="54" r="2.6" fill="#6b3a1b" ${st(1)}/><path d="M578,56 L588,56 L590,104 L581,106 Z" fill="url(#scarf)" ${st(1.3)}/>` +
    `<path d="M583,56 L577,98 L585,100 Z" fill="url(#scarf)" ${st(1.3)}/><path d="M581,106 L581,110 M584,105.5 L584,109.5 M587,105 L587,109 M590,104.5 L590,108.5" stroke="#d23a3a" stroke-width="1.4"/>`;

  // --- Boden: Holzdielen in Perspektive ---
  s += '<rect y="192" width="600" height="208" fill="#9b5d2c"/>';
  const vy = -500, top = 192, bot = 400, k = (top - vy) / (bot - vy);
  const lines = [];
  for (let xb = -340; xb <= 950; xb += 44) lines.push([300 + (xb - 300) * k, xb]);
  const cols = ['#a3642f', '#965a2a', '#ab6b35', '#9e602d', '#a8682f'];
  for (let i = 0; i < lines.length - 1; i++) {
    const [a1, b1] = lines[i], [a2, b2] = lines[i + 1];
    s += `<path d="M${f(a1)},${top} L${f(a2)},${top} L${f(b2)},${bot} L${f(b1)},${bot} Z" fill="${pick(cols)}"/>`;
    const xa = (y, a, b) => a + (b - a) * (y - top) / (bot - top);
    let y = top + 6 + rnd() * 40;
    while (y < bot) {
      s += `<path d="M${f(xa(y, a1, b1))},${f(y)} L${f(xa(y, a2, b2))},${f(y)}" stroke="#6e3d1a" stroke-width="1.1"/>`;
      if (rnd() < 0.25) s += `<ellipse cx="${f((xa(y + 14, a1, b1) + xa(y + 14, a2, b2)) / 2)}" cy="${f(y + 14)}" rx="2.6" ry="1.2" fill="none" stroke="#7a4520" stroke-width="1"/>`;
      y += 34 + rnd() * 60;
    }
  }
  for (const [a, b] of lines) s += `<path d="M${f(a)},${top} L${f(b)},${bot}" stroke="#6e3d1a" stroke-width="1.2"/>`;
  s += '<rect y="192" width="600" height="26" fill="url(#fshade)"/>';
  s += '<ellipse class="fglow" cx="300" cy="214" rx="220" ry="52" fill="url(#fireglow)"/>';

  // --- Teppich ---
  s += '<ellipse cx="300" cy="309" rx="182" ry="64" fill="#000" opacity=".2"/>';
  for (let a = 0; a < 360; a += 6) {
    const r = a * Math.PI / 180, x = 300 + Math.cos(r) * 178, y = 304 + Math.sin(r) * 62;
    s += `<path d="M${f(x)},${f(y)} L${f(300 + Math.cos(r) * 184)},${f(304 + Math.sin(r) * 66)}" stroke="#efdcae" stroke-width="1.6"/>`;
  }
  s += `<ellipse cx="300" cy="304" rx="178" ry="62" fill="#7c1f2c" ${st(2)}/>` +
    '<ellipse cx="300" cy="304" rx="168" ry="57" fill="#efdcae"/><ellipse cx="300" cy="304" rx="160" ry="53" fill="#24467a"/>' +
    '<ellipse cx="300" cy="304" rx="153" ry="50" fill="none" stroke="#efdcae" stroke-width="2.4" stroke-dasharray="2 7"/>' +
    '<ellipse cx="300" cy="304" rx="145" ry="47" fill="#b8343f"/>';
  for (let i = 0; i < 12; i++) {
    const r = (i / 12) * Math.PI * 2, x = 300 + Math.cos(r) * 112, y = 304 + Math.sin(r) * 34.5;
    s += `<path d="M${f(x - 12)},${f(y)} L${f(x)},${f(y - 6)} L${f(x + 12)},${f(y)} L${f(x)},${f(y + 6)} Z" fill="#efdcae"/><path d="M${f(x - 5)},${f(y)} L${f(x)},${f(y - 2.5)} L${f(x + 5)},${f(y)} L${f(x)},${f(y + 2.5)} Z" fill="#24467a"/>`;
  }
  s += '<ellipse cx="300" cy="304" rx="72" ry="23" fill="none" stroke="#efdcae" stroke-width="2"/>' +
    '<ellipse cx="300" cy="304" rx="62" ry="20" fill="#efdcae"/><ellipse cx="300" cy="304" rx="54" ry="17" fill="#24467a"/>' +
    '<path d="M300,292 L306,300 L318,304 L306,308 L300,316 L294,308 L282,304 L294,300 Z" fill="#efdcae"/><circle cx="300" cy="304" r="3" fill="#b8343f"/>';
  save('bg', s, defs, css);
}

// ============================ KAMIN ============================
function stones(x0, y0, x1, y1, rowH = 12) {
  let s = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#8e8174"/>`;
  let row = 0;
  for (let y = y0; y < y1; y += rowH, row++) {
    let x = x0 - (row % 2 ? 10 : 0);
    while (x < x1) {
      const w = 15 + rnd() * 13, xa = Math.max(x, x0) + 1, xb = Math.min(x + w, x1) - 1, h = Math.min(rowH, y1 - y) - 2;
      if (xb - xa > 3 && h > 2) s += `<rect x="${f(xa)}" y="${f(y + 1)}" width="${f(xb - xa)}" height="${f(h)}" rx="3" fill="${pick(['#b4a796', '#a89a89', '#bdb19f', '#a1937f', '#b0a28f'])}" ${st(1, '#5e5348')}/>`;
      x += w;
    }
  }
  return s;
}
function kamin() {
  const defs = glowGrad('inner', '#ff9a2e', 0.9) + glowGrad('cglow', '#ffd36a', 0.7);
  const css = CSS_FLAME + CSS_GLOW + '.emb{animation:tw 1.3s ease-in-out infinite}@keyframes tw{0%,100%{opacity:1}50%{opacity:.3}}';
  let s = '';
  // Kaminschacht + Korpus aus Naturstein
  s += stones(250, 10, 350, 88) + `<rect x="250" y="10" width="100" height="78" fill="none" ${st(1.8)}/>`;
  s += stones(230, 96, 370, 190) + `<rect x="230" y="96" width="140" height="94" fill="none" ${st(2)}/>`;
  // Uhr
  s += `<circle cx="300" cy="48" r="16" fill="#6b3a1b" ${st(1.8)}/><circle cx="300" cy="48" r="12" fill="#f6ecd2" ${st(1.2)}/>`;
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<circle cx="${f(300 + Math.cos(a) * 9.5)}" cy="${f(48 + Math.sin(a) * 9.5)}" r=".9" fill="#3a2a1a"/>`; }
  s += '<path d="M300,48 L300,41 M300,48 L305,50" stroke="#2a1a10" stroke-width="1.6" stroke-linecap="round"/><circle cx="300" cy="48" r="1.4" fill="#c0392b"/>';
  // Feueroeffnung
  s += '<path d="M260,190 L260,132 Q260,113 300,113 Q340,113 340,132 L340,190 Z" fill="#1c0f08"/>';
  s += '<path d="M266,140 H334 M264,152 H336 M262,164 H338 M262,176 H338 M282,130 V140 M300,140 V152 M318,130 V140 M290,152 V164 M312,152 V164 M280,164 V176 M320,164 V176" stroke="#3b1f12" stroke-width="1.3"/>';
  s += '<ellipse class="glow" cx="300" cy="170" rx="44" ry="30" fill="url(#inner)"/>';
  s += '<path class="fl1" d="M274,182 C266,162 278,150 282,134 C285,146 290,150 292,140 C294,128 300,120 302,106 C311,122 317,136 314,148 C318,144 322,138 323,128 C332,146 332,166 324,182 Z" fill="#ff7b16" ' + st(1.3, '#b4410c') + '/>';
  s += '<path class="fl2" d="M283,182 C277,166 286,154 290,144 C292,152 296,154 298,146 C300,138 304,132 306,122 C313,138 317,150 314,160 C318,156 320,152 321,146 C326,160 323,172 317,182 Z" fill="#ffb62e"/>';
  s += '<path class="fl3" d="M291,182 C287,170 294,162 298,152 C300,160 304,162 306,155 C311,165 313,174 309,182 Z" fill="#fff0a0"/>';
  // Holzscheite
  s += `<path d="M268,178 L330,186 L328,192 L266,184 Z" fill="#6b3b1c" ${st(1.6)}/><ellipse cx="267" cy="181" rx="3" ry="4" fill="#d9a066" ${st(1.2)}/>` +
    `<path d="M334,176 L272,187 L274,193 L336,182 Z" fill="#7d4524" ${st(1.6)}/><ellipse cx="335" cy="179" rx="3" ry="4" fill="#d9a066" ${st(1.2)}/>`;
  for (const [x, y] of [[284, 186], [296, 188], [312, 187], [322, 184]]) s += `<circle class="emb" style="animation-delay:-${f(rnd())}s" cx="${x}" cy="${y}" r="1.6" fill="#ffd54a"/>`;
  s += `<path d="M260,190 L260,132 Q260,113 300,113 Q340,113 340,132 L340,190" fill="none" ${st(2.6)}/>`;
  // Kaminsims mit Girlande, Kerzen, Deko
  s += `<rect x="236" y="96" width="12" height="10" fill="#5c3216" ${st(1.4)}/><rect x="352" y="96" width="12" height="10" fill="#5c3216" ${st(1.4)}/>`;
  s += `<rect x="220" y="86" width="160" height="11" rx="2" fill="#5c3216" ${st(2)}/><rect x="222" y="87.5" width="156" height="3" fill="#7d4a25"/>`;
  s += '<path d="M222,96 Q238,108 254,96 Q270,108 286,96 Q302,108 318,96 Q334,108 350,96 Q366,108 378,96" fill="none" stroke="#2f6b2a" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M222,96 Q238,108 254,96 Q270,108 286,96 Q302,108 318,96 Q334,108 350,96 Q366,108 378,96" fill="none" stroke="#5aa64a" stroke-width="2" stroke-dasharray="3 5"/>';
  for (const x of [238, 270, 302, 334, 364]) s += `<circle cx="${x}" cy="103" r="2.3" fill="#d4242f" ${st(0.8)}/><circle cx="${x + 3}" cy="101.5" r="1.8" fill="#e8343f"/>`;
  // Socken
  const sock = (col) => `<path d="M0,0 L14,0 L14,18 C14,23 20,24 22,26 C24,30 20,33 14,33 L4,33 C0,33 0,28 0,24 Z" fill="${col}" ${st(1.4)}/>` +
    `<rect x="-1.5" y="-3" width="17" height="7" rx="1.5" fill="#f4eee0" ${st(1.2)}/><path d="M4,10 L10,10 M4,15 L10,15" stroke="#f4eee0" stroke-width="2"/>`;
  s += `<g transform="translate(250,104) scale(-1,1)">${sock('#c8303a')}</g><g transform="translate(350,104)">${sock('#2f8a46')}</g>`;
  s += candle(230, 86, 14) + candle(240, 86, 10) + candle(370, 86, 14) + candle(360, 86, 10);
  s += `<rect x="256" y="68" width="18" height="18" rx="1" fill="#d4a43a" ${st(1.3)}/><rect x="259" y="71" width="12" height="12" fill="#f7c9d8"/><path d="M265,81 C259,77 261,73 265,75.5 C269,73 271,77 265,81 Z" fill="#e2445c"/>`;
  s += `<rect x="332" y="81" width="14" height="5" rx="1" fill="#6b3a1b" ${st(1.1)}/><circle cx="339" cy="74" r="8" fill="#cfefff" opacity=".85" ${st(1.2)}/><path d="M333,77 C336,75 342,75 345,77 L345,79 L333,79 Z" fill="#fff"/><path d="M339,69 L342,75 L336,75 Z" fill="#2f7a4a"/>`;
  // Steinplatte vor dem Kamin (auf dem Boden)
  s += `<path d="M222,188 L378,188 L390,206 L210,206 Z" fill="#9d9083" ${st(1.8)}/><path d="M224,190 L376,190 L380,196 L220,196 Z" fill="#b0a395"/>`;
  save('kamin', s, defs, css);
}

// ============================ BUECHERREGAL ============================
function regal() {
  const bookCols = ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#16a085', '#d35400', '#ecf0f1', '#2c3e50', '#e84393'];
  let s = '';
  s += `<ellipse cx="500" cy="194" rx="72" ry="6" fill="#000" opacity=".25"/>`;
  s += `<rect x="434" y="24" width="132" height="166" fill="#5a3016" ${st(2)}/><rect x="442" y="30" width="116" height="150" fill="#2e170a"/>`;
  const books = (x0, x1, yb, maxH) => {
    let out = '', x = x0;
    while (x < x1 - 6) {
      const w = 5 + rnd() * 6, h = maxH - rnd() * 9, c = pick(bookCols);
      if (x + w > x1) break;
      if (rnd() < 0.08 && x + h < x1) { // liegender Stapel
        for (let i = 0; i < 3; i++) out += `<rect x="${f(x)}" y="${f(yb - 5 * (i + 1))}" width="${f(h - i * 2)}" height="5" fill="${pick(bookCols)}" ${st(1)}/>`;
        x += h + 2; continue;
      }
      out += `<rect x="${f(x)}" y="${f(yb - h)}" width="${f(w)}" height="${f(h)}" fill="${c}" ${st(1)}/>` +
        `<path d="M${f(x + 1)},${f(yb - h + 3)} H${f(x + w - 1)} M${f(x + 1)},${f(yb - 4)} H${f(x + w - 1)}" stroke="#f3d27a" stroke-width="1" opacity=".85"/>`;
      x += w;
    }
    return out;
  };
  // Fach 1: Buecher + Globus
  s += books(444, 520, 62, 28);
  s += `<path d="M538,62 L546,62 L544,58 L540,58 Z" fill="#c79a32" ${st(1)}/><path d="M531,40 A12,12 0 0 1 551,52" fill="none" ${st(1.4, '#c79a32')}/>` +
    `<circle cx="541" cy="46" r="10.5" fill="#3a8fd6" ${st(1.4)}/><path d="M535,40 C539,38 542,42 539,45 C536,48 540,52 537,54 C533,50 532,44 535,40 Z M543,40 C548,41 550,46 547,49 C545,47 544,44 543,40 Z" fill="#4fbf5a"/>`;
  // Fach 2: Buecher + Pflanze
  s += books(444, 532, 100, 28);
  s += `<path d="M536,100 L552,100 L550,88 L538,88 Z" fill="#d07a46" ${st(1.2)}/>` +
    '<path d="M544,88 C540,80 534,78 532,72 C538,74 542,78 544,86 C545,78 548,72 554,70 C552,78 548,82 545,88 Z" fill="#4caa52" ' + st(1) + '/>';
  // Fach 3: Pokal + Buecher
  s += `<path d="M452,138 H466 L464,134 H454 Z" fill="#c79a32" ${st(1.1)}/><rect x="457" y="128" width="4" height="6" fill="#e2b13c"/>` +
    `<path d="M450,112 H468 C468,124 464,128 459,128 C454,128 450,124 450,112 Z" fill="#f2c94c" ${st(1.3)}/><path d="M450,115 C445,115 445,121 451,122 M468,115 C473,115 473,121 467,122" fill="none" ${st(1.3, '#c79a32')}/>` +
    '<text x="459" y="122" font-family="Verdana" font-size="5" font-weight="bold" fill="#8a5a10" text-anchor="middle">XO</text>';
  s += books(472, 556, 138, 28);
  // Fach 4: grosse Atlanten + Keksglas
  s += books(444, 518, 180, 32);
  s += `<rect x="524" y="156" width="26" height="24" rx="4" fill="#dff1ff" opacity=".85" ${st(1.3)}/><rect x="522" y="151" width="30" height="6" rx="2" fill="#c0392b" ${st(1.2)}/>`;
  for (const [x, y] of [[530, 172], [540, 168], [534, 163], [545, 175]]) s += `<circle cx="${x}" cy="${y}" r="4" fill="#c98a4b" ${st(0.8)}/><circle cx="${x - 1}" cy="${y - 1}" r=".8" fill="#4a2810"/>`;
  // Regalboeden, Krone, Sockel
  for (const y of [62, 100, 138]) s += `<rect x="442" y="${y}" width="116" height="6" fill="#6b3a1b" ${st(1.2)}/>`;
  s += `<rect x="434" y="24" width="8" height="166" fill="#6b3a1b" ${st(1.4)}/><rect x="558" y="24" width="8" height="166" fill="#6b3a1b" ${st(1.4)}/>`;
  s += `<rect x="428" y="17" width="144" height="10" rx="2" fill="#6b3a1b" ${st(2)}/><rect x="430" y="18.5" width="140" height="2.5" fill="#8d5429"/>`;
  s += `<rect x="434" y="180" width="132" height="12" fill="#4a2610" ${st(2)}/>`;
  // Pflanze oben drauf
  s += `<path d="M444,17 L462,17 L459,4 L447,4 Z" fill="#d07a46" ${st(1.3)}/>` +
    `<path d="M452,4 C446,-2 438,0 432,6 C440,6 446,6 452,4 Z M454,4 C458,-4 466,-4 472,0 C466,4 460,5 454,4 Z M450,6 C442,10 438,20 440,30 C444,22 448,14 452,6 Z" fill="#4caa52" ${st(1.1)}/>`;
  save('regal', s);
}

function schalter() {
  save('schalter', `<rect x="573" y="107" width="16" height="22" rx="2.5" fill="#f2e8d4" ${st(1.6)}/><rect x="578.5" y="111.5" width="5" height="13" rx="1.2" fill="#ddd0b6" ${st(1.2)}/><rect x="579.5" y="112.5" width="3" height="5" fill="#fff"/>`);
}

// ============================ LICHTERKETTE ============================
function lichter() {
  const css = CSS_TW;
  const segs = [[[0, 14], [75, 44], [150, 16]], [[150, 16], [225, 44], [300, 16]], [[300, 16], [375, 44], [450, 16]], [[450, 16], [525, 44], [600, 14]]];
  const cols = ['#ffd34d', '#ff5a5a', '#5ad16a', '#5aa8ff', '#ff9a3c'];
  let s = `<path d="M0,14 Q75,44 150,16 Q225,44 300,16 Q375,44 450,16 Q525,44 600,14" fill="none" stroke="#2a1a10" stroke-width="1.5"/>`, i = 0;
  for (const [a, c, b] of segs) {
    for (const t of [0.12, 0.29, 0.5, 0.71, 0.88]) {
      const x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0];
      const y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1];
      const col = cols[i++ % cols.length];
      s += `<g class="tw" style="animation-delay:-${f(rnd() * 2.6)}s"><circle cx="${f(x)}" cy="${f(y + 5)}" r="7.5" fill="${col}" opacity=".3"/>` +
        `<rect x="${f(x - 1.6)}" y="${f(y - .5)}" width="3.2" height="3" fill="#3a3a3a"/>` +
        `<ellipse cx="${f(x)}" cy="${f(y + 5.5)}" rx="2.6" ry="3.6" fill="${col}" ${st(0.9)}/><ellipse cx="${f(x - .8)}" cy="${f(y + 4.4)}" rx=".8" ry="1.3" fill="#fff" opacity=".8"/></g>`;
    }
  }
  save('lichter', s, '', css);
}

// ============================ MOEBEL ============================
function sofa() {
  const defs = '<pattern id="plaid" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#c8303a"/>' +
    '<rect x="4" width="3" height="12" fill="#f4e6c8" opacity=".85"/><rect y="4" width="12" height="3" fill="#f4e6c8" opacity=".85"/><rect x="10" width="1" height="12" fill="#7a1820"/></pattern>';
  let s = '<ellipse cx="123" cy="272" rx="104" ry="8" fill="#000" opacity=".28"/>';
  // Ruecken mit Knoepfen
  s += `<path d="M44,240 L44,212 C44,200 52,193 64,193 L182,193 C194,193 202,200 202,212 L202,240 Z" fill="#2f8f9d" ${st(2)}/>`;
  s += '<path d="M50,205 C52,198 58,196.5 64,196.5 L182,196.5 C188,196.5 194,198 196,205 C178,201.5 68,201.5 50,205 Z" fill="#55b8c4"/>';
  for (let r = 0; r < 2; r++) for (let x = (r ? 79 : 66); x < 190; x += 26) {
    const y = r ? 224 : 212;
    s += `<path d="M${x - 5},${y - 3} L${x},${y} L${x + 5},${y - 3} M${x - 5},${y + 3} L${x},${y} L${x + 5},${y + 3}" stroke="#23707b" stroke-width="1"/><circle cx="${x}" cy="${y}" r="1.8" fill="#1d5f69"/>`;
  }
  // Kissen
  for (const x of [56, 102, 148]) {
    s += `<rect x="${x}" y="246" width="46" height="18" rx="5" fill="#2a7f8b" ${st(1.8)}/>`;
    s += `<rect x="${x}" y="232" width="46" height="20" rx="7" fill="#45a9b6" ${st(1.8)}/><path d="M${x + 6},236 H${x + 40}" stroke="#7fd0da" stroke-width="2" stroke-linecap="round"/>`;
  }
  // Armlehnen
  const arm = (cx) => `<rect x="${cx - 15}" y="218" width="30" height="48" rx="9" fill="#2f8f9d" ${st(2)}/>` +
    `<circle cx="${cx}" cy="220" r="15" fill="#3a9fac" ${st(2)}/><circle cx="${cx}" cy="220" r="8.5" fill="none" stroke="#23707b" stroke-width="1.6"/><circle cx="${cx}" cy="220" r="2.5" fill="#23707b"/>` +
    `<path d="M${cx - 10},211 C${cx - 6},207 ${cx + 2},206 ${cx + 8},209" fill="none" stroke="#6cc6d1" stroke-width="2.4" stroke-linecap="round"/>`;
  s += arm(43) + arm(203);
  s += `<rect x="30" y="261" width="186" height="8" rx="2" fill="#23707b" ${st(2)}/>`;
  s += `<rect x="36" y="268" width="7" height="6" fill="#4a2610" ${st(1.2)}/><rect x="203" y="268" width="7" height="6" fill="#4a2610" ${st(1.2)}/>`;
  // Zierkissen (Senf + Rosa mit Herz)
  s += `<g transform="rotate(-14 74 225)"><rect x="61" y="212" width="26" height="26" rx="7" fill="#e9b73b" ${st(1.8)}/><path d="M65,216 L83,234 M83,216 L65,234" stroke="#c9952a" stroke-width="1.2"/><circle cx="74" cy="225" r="2" fill="#a8761a"/></g>`;
  s += `<g transform="rotate(12 172 225)"><rect x="159" y="212" width="26" height="26" rx="7" fill="#ee7fa3" ${st(1.8)}/><path d="M172,232 C163,226 165,218 172,222 C179,218 181,226 172,232 Z" fill="#fff" ${st(1)}/></g>`;
  // Kuscheldecke ueber der rechten Lehne
  s += `<path d="M186,214 C194,206 214,206 219,216 L221,262 C215,266 207,262 201,266 C197,256 192,238 188,232 Z" fill="url(#plaid)" ${st(1.8)}/>`;
  s += '<path d="M201,266 L200,271 M205,264.5 L204.5,269.5 M209,263.5 L209,268.5 M213,264 L213.5,269 M217,263 L218,268" stroke="#c8303a" stroke-width="1.6"/>';
  save('sofa', s, defs);
}

function sessel() {
  const M = '#3d7a45', L = '#58a061', D = '#2c5c33';
  let s = '<ellipse cx="410" cy="270" rx="42" ry="6" fill="#000" opacity=".28"/>';
  s += `<path d="M388,242 L388,206 C388,192 398,185 410,185 C422,185 432,192 432,206 L432,242 Z" fill="${M}" ${st(2)}/>`;
  s += `<path d="M394,198 C398,190 404,188.5 410,188.5 C416,188.5 422,190 426,198 C418,195 402,195 394,198 Z" fill="${L}"/>`;
  for (const [x, y] of [[400, 206], [420, 206], [410, 216], [400, 226], [420, 226]]) s += `<circle cx="${x}" cy="${y}" r="1.8" fill="${D}"/>`;
  s += `<path d="M388,206 C379,206 375,213 375,223 L377,246 L390,246 Z" fill="${M}" ${st(2)}/><path d="M432,206 C441,206 445,213 445,223 L443,246 L430,246 Z" fill="${M}" ${st(2)}/>`;
  s += `<rect x="386" y="248" width="48" height="14" rx="4" fill="${D}" ${st(1.8)}/><rect x="388" y="236" width="44" height="17" rx="6" fill="${L}" ${st(1.8)}/><path d="M394,240 H426" stroke="#7cc285" stroke-width="2" stroke-linecap="round"/>`;
  s += `<rect x="373" y="230" width="19" height="34" rx="7" fill="${M}" ${st(2)}/><rect x="428" y="230" width="19" height="34" rx="7" fill="${M}" ${st(2)}/>`;
  s += `<path d="M377,234 C380,231 386,231 389,234 M431,234 C434,231 440,231 443,234" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`;
  s += `<path d="M379,262 L377,272 L382,272 Z M441,262 L443,272 L438,272 Z" fill="#4a2610" ${st(1.2)}/>`;
  // gehaekeltes Deckchen
  s += `<path d="M400,186 C404,182 416,182 420,186 L418,196 C414,198 406,198 402,196 Z" fill="#f4eee0" ${st(1.2)}/><path d="M403,190 H417 M404,193 H416" stroke="#d9cfb8" stroke-width="1" stroke-dasharray="2 2"/>`;
  save('sessel', s);
}

function grammophon() {
  let s = '<ellipse cx="471" cy="269" rx="26" ry="4.5" fill="#000" opacity=".28"/>';
  s += `<path d="M458,244 L455,267 M471,246 L471,268 M484,244 L487,267" ${st(3, '#4a2610')}/><path d="M458,244 L455,267 M471,246 L471,268 M484,244 L487,267" stroke="#6b3a1b" stroke-width="1.4"/>`;
  s += `<ellipse cx="471" cy="257" rx="15" ry="3.5" fill="#5a3016" ${st(1.4)}/>`;
  s += `<ellipse cx="471" cy="243" rx="23" ry="6.5" fill="#4a2610" ${st(1.8)}/><ellipse cx="471" cy="240.5" rx="23" ry="6.5" fill="#7a4420" ${st(1.8)}/>`;
  s += `<rect x="458" y="224" width="27" height="15" rx="2" fill="#8a4b22" ${st(1.8)}/><path d="M461,231 H482" stroke="#e2b13c" stroke-width="1.4"/><circle cx="471" cy="235" r="1.6" fill="#e2b13c"/>`;
  s += `<ellipse cx="471" cy="224" rx="12" ry="3.4" fill="#222" ${st(1.2)}/><ellipse cx="471" cy="224" rx="3.4" ry="1.1" fill="#d23a3a"/>`;
  s += `<path d="M482,223 C486,214 484,206 476,202" fill="none" stroke="${K}" stroke-width="5.4" stroke-linecap="round"/><path d="M482,223 C486,214 484,206 476,202" fill="none" stroke="#d9a63a" stroke-width="3" stroke-linecap="round"/>`;
  s += `<path d="M479,205 L447,196 L463,174 Z" fill="#e3b23c" ${st(1.8)}/>`;
  s += `<g transform="rotate(-38 455 185)"><ellipse cx="455" cy="185" rx="18" ry="12" fill="#f3c24c" ${st(2)}/><ellipse cx="456" cy="186" rx="11" ry="7" fill="#8a5c12"/>` +
    `<path d="M437,185 C444,180 448,186 455,173 M473,185 C466,180 462,186 455,197" fill="none" stroke="#c28f22" stroke-width="1.2"/></g>`;
  s += `<path d="M474,222 L480,220" ${st(1.6)}/>`;
  save('grammophon', s);
}

function tisch() {
  const css = CSS_STEAM + CSS_FLAME + CSS_GLOW;
  let s = '<ellipse cx="300" cy="303" rx="44" ry="8" fill="#000" opacity=".25"/>';
  s += `<rect x="294" y="290" width="12" height="11" fill="#5a3016" ${st(1.6)}/><ellipse cx="300" cy="300" rx="16" ry="4" fill="#5a3016" ${st(1.6)}/>`;
  s += `<ellipse cx="300" cy="288" rx="46" ry="14" fill="#4a2610" ${st(2)}/><ellipse cx="300" cy="284.5" rx="46" ry="14" fill="#8a4f24" ${st(2)}/>`;
  s += '<ellipse cx="300" cy="284.5" rx="37" ry="10" fill="none" stroke="#a8662f" stroke-width="1.4"/><ellipse cx="300" cy="284.5" rx="24" ry="6" fill="none" stroke="#9a5a29" stroke-width="1"/>';
  s += `<ellipse cx="301" cy="288" rx="12" ry="3.6" fill="#fff" ${st(1.2)}/>`;
  for (const [x, y] of [[296, 286.5], [303, 286], [307, 288.5]]) s += `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="1.6" fill="#c98a4b" ${st(0.8)}/>`;
  s += mug(282, 285, '#d63a3a') + steam(282, 268) + mug(321, 286, '#2f6fd0') + steam(321, 269);
  s += `<ellipse cx="262" cy="283" rx="6" ry="2" fill="#e8d7b4" ${st(1)}/>` + candle(262, 282, 8, '#f6ecd2');
  save('tisch', s, glowGrad('cglow', '#ffd36a', 0.7), css);
}

function beanbag(cx, cy, c, cl, cd, deco) {
  const dx = cx - 538, dy = cy - 312;
  let s = `<ellipse cx="${cx}" cy="${cy + 14}" rx="38" ry="6" fill="#000" opacity=".25"/>`;
  s += `<g transform="translate(${dx},${dy})">`;
  s += `<path d="M504,322 C496,306 506,288 522,284 C530,275 548,275 556,284 C570,288 580,304 572,322 C560,331 516,331 504,322 Z" fill="${c}" ${st(2)}/>`;
  s += `<path d="M506,318 C512,326 562,328 570,318 C566,326 556,330 538,330 C520,330 510,326 506,318 Z" fill="${cd}"/>`;
  s += `<path d="M512,298 C516,288 526,284 534,284 C526,290 518,296 512,298 Z" fill="${cl}"/>`;
  s += `<path d="M520,304 C528,310 548,310 556,304" fill="none" stroke="${cd}" stroke-width="2" stroke-linecap="round"/>`;
  s += `<path d="M538,277 C536,272 540,270 542,273" fill="none" ${st(1.4)}/>` + deco + '</g>';
  return s;
}
function sack1() {
  save('sack1', beanbag(538, 312, '#ef7aa9', '#ffadcd', '#cf5a8a',
    `<path d="M556,316 C550,312 551,306 556,309 C561,306 562,312 556,316 Z" fill="#fff" ${st(1)}/>`));
}
function sack2() {
  save('sack2', beanbag(214, 362, '#4f86e0', '#86b0f2', '#3864b4',
    `<path d="M520,316 L523,310 L526,316 L532,316 L527,320 L529,326 L523,322 L517,326 L519,320 L514,316 Z" fill="#ffd34d" ${st(1)}/>`));
}

function spieltisch() {
  let s = '<ellipse cx="470" cy="379" rx="34" ry="5" fill="#000" opacity=".28"/>';
  s += `<rect x="465" y="356" width="10" height="20" fill="#5a3016" ${st(1.6)}/><ellipse cx="470" cy="376" rx="15" ry="4" fill="#5a3016" ${st(1.6)}/>`;
  s += `<ellipse cx="470" cy="354.5" rx="33" ry="10.5" fill="#4a2610" ${st(2)}/><ellipse cx="470" cy="351" rx="33" ry="10.5" fill="#7a4420" ${st(2)}/>`;
  s += `<path d="M452,345 L488,345 L493,357 L447,357 Z" fill="#efdcae" ${st(1.3)}/>`;
  s += '<path d="M464,345 L462.3,357 M476,345 L477.7,357 M450.3,349 L489.7,349 M448.7,353 L491.3,353" stroke="#7a4420" stroke-width="1.2"/>';
  s += '<path d="M455,345.8 L459,348.3 M459,345.8 L455,348.3 M467.5,350 L472.5,352.3 M472.5,350 L467.5,352.3" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round"/>' +
    '<ellipse cx="482" cy="347" rx="2.4" ry="1.4" fill="none" stroke="#2e6fd0" stroke-width="1.4"/><ellipse cx="456" cy="355" rx="2.6" ry="1.4" fill="none" stroke="#2e6fd0" stroke-width="1.4"/>';
  save('spieltisch', s);
}
function hocker() {
  const one = (x) => `<ellipse cx="${x}" cy="373" rx="15" ry="3.5" fill="#000" opacity=".25"/>` +
    `<path d="M${x - 9},356 L${x - 11},372 M${x + 9},356 L${x + 11},372 M${x},358 L${x},373" ${st(3, '#4a2610')}/>` +
    `<path d="M${x - 9},356 L${x - 11},372 M${x + 9},356 L${x + 11},372 M${x},358 L${x},373" stroke="#7a4420" stroke-width="1.3"/>` +
    `<path d="M${x - 14},352 L${x - 14},356 C${x - 14},360 ${x + 14},360 ${x + 14},356 L${x + 14},352 Z" fill="#8e2630" ${st(1.6)}/>` +
    `<ellipse cx="${x}" cy="352" rx="14" ry="5" fill="#c0392b" ${st(1.6)}/><ellipse cx="${x - 3}" cy="351" rx="6" ry="1.6" fill="#e05a4c"/>`;
  save('hocker', one(428) + one(512));
}

function kakao() {
  const defs = '<pattern id="awn" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="10" height="20" fill="#d23a3a"/><rect x="10" width="10" height="20" fill="#f6eee0"/></pattern>';
  let s = '<ellipse cx="75" cy="377" rx="60" ry="7" fill="#000" opacity=".28"/><g transform="translate(0,22)">';
  s += `<rect x="25" y="254" width="4" height="46" fill="#efe6d4" ${st(1.2)}/><rect x="121" y="254" width="4" height="46" fill="#efe6d4" ${st(1.2)}/>`;
  // Theke
  s += `<rect x="24" y="298" width="102" height="52" fill="#8a4b22" ${st(2)}/>`;
  for (let x = 30; x < 124; x += 12) s += `<path d="M${x},300 V348" stroke="#71391a" stroke-width="1.2"/>`;
  s += `<rect x="32" y="308" width="86" height="30" rx="3" fill="#f6e7c8" ${st(1.6)}/>`;
  s += '<text x="85" y="328.5" font-family="Georgia, Times New Roman, serif" font-size="14" font-weight="bold" fill="#7a2e14" text-anchor="middle" letter-spacing="1">KAKAO</text>';
  s += `<rect x="37" y="316" width="9" height="12" rx="1.5" fill="#d63a3a" ${st(1.2)}/><path d="M46,319 C50,319 50,325 46,325" fill="none" ${st(1.3)}/>`;
  s += `<rect x="20" y="292" width="110" height="8" rx="2" fill="#5a3016" ${st(2)}/>`;
  // Topf
  s += `<path d="M38,276 L66,276 L64,292 L40,292 Z" fill="#c8742e" ${st(1.8)}/><path d="M42,279 L44,290" stroke="#efa060" stroke-width="2.4" stroke-linecap="round"/>` +
    `<rect x="36" y="272" width="32" height="5" rx="2" fill="#a85a22" ${st(1.6)}/><path d="M36,280 C31,280 31,286 37,286 M68,280 C73,280 73,286 67,286" fill="none" ${st(1.6)}/>`;
  // Tassenstapel + Marshmallow-Glas
  s += mug(82, 292, '#d63a3a', 10) + mug(97, 292, '#f2c41a', 10) + mug(89.5, 281, '#2f6fd0', 10);
  s += `<rect x="106" y="274" width="16" height="18" rx="3" fill="#e6f5ff" opacity=".9" ${st(1.3)}/><rect x="105" y="271" width="18" height="4" rx="1.5" fill="#8a4b22" ${st(1.1)}/>`;
  for (const [x, y, c] of [[110, 288, '#fff'], [116, 287, '#ffd0e0'], [112, 282, '#ffd0e0'], [118, 281, '#fff'], [110, 277.5, '#fff']]) s += `<rect x="${x - 2}" y="${y - 2}" width="4" height="4" rx="1" fill="${c}" ${st(0.6)}/>`;
  // Markise
  s += `<path d="M28,246 L122,246 L132,259 L18,259 Z" fill="url(#awn)" ${st(1.8)}/>`;
  let sc = 'M18,259';
  for (let x = 18; x < 132; x += 11.4) sc += ` Q${f(x + 5.7)},268 ${f(x + 11.4)},259`;
  s += `<path d="${sc} Z" fill="#d23a3a" ${st(1.8)}/>`;
  s += `<g class="steam" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M46,274 C42,268 50,264 46,258"/><path d="M53,274 C49,268 57,264 53,258"/><path d="M60,274 C56,268 64,264 60,258"/></g>`;
  s += '</g>';
  save('kakao', s, defs, CSS_STEAM);
}

function puffle(awake) {
  const css = awake
    ? '.pb{animation:hop .45s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}@keyframes hop{from{transform:translateY(0) scale(1.05,.95)}to{transform:translateY(-9px) scale(.96,1.05)}}'
    : '.pb{animation:br 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes br{0%,100%{transform:scale(1,1)}50%{transform:scale(1.04,.95)}}' +
      '.z{animation:zz 3s ease-in infinite;opacity:0}.z2{animation-delay:-1s}.z3{animation-delay:-2s}@keyframes zz{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(-8px,-16px)}}';
  let s = '<ellipse cx="250" cy="231" rx="25" ry="5" fill="#000" opacity=".25"/>';
  s += `<path d="M227,213 L273,213 L268,230 C260,234 240,234 232,230 Z" fill="#b07a3a" ${st(1.8)}/>`;
  s += '<path d="M231,219 H269 M233,225 H267 M240,213 L238,232 M250,213 V233 M260,213 L262,232" stroke="#8a5a26" stroke-width="1.1"/>';
  s += `<ellipse cx="250" cy="212" rx="23" ry="6" fill="#c58d48" ${st(1.8)}/><ellipse cx="250" cy="211.5" rx="18" ry="3.8" fill="#e85b7a"/>`;
  s += '<g class="pb">';
  s += `<path d="M244,195 L241,186 L247,192 L250,183 L253,192 L259,186 L256,195 Z" fill="#3aa83c" ${st(1.4)}/>`;
  s += `<ellipse cx="250" cy="203" rx="14" ry="11" fill="#4cc44e" ${st(1.8)}/><ellipse cx="245" cy="198" rx="5" ry="3" fill="#86e388"/>`;
  if (awake) {
    s += `<ellipse cx="245" cy="201" rx="3.6" ry="4.6" fill="#fff" ${st(1.1)}/><ellipse cx="255" cy="201" rx="3.6" ry="4.6" fill="#fff" ${st(1.1)}/>` +
      '<circle cx="246" cy="202" r="1.9" fill="#14141c"/><circle cx="256" cy="202" r="1.9" fill="#14141c"/>' +
      `<path d="M244,207 C247,212 253,212 256,207 Z" fill="#7a1a2a" ${st(1.1)}/>`;
  } else {
    s += '<path d="M241.5,203 C243.5,205 246.5,205 248.5,203 M251.5,203 C253.5,205 256.5,205 258.5,203" fill="none" stroke="#14141c" stroke-width="1.4" stroke-linecap="round"/>' +
      '<ellipse cx="243" cy="207" rx="2.4" ry="1.3" fill="#ff8fa8" opacity=".7"/><ellipse cx="257" cy="207" rx="2.4" ry="1.3" fill="#ff8fa8" opacity=".7"/>';
  }
  s += '</g>';
  if (!awake) for (const [c, x, y, fs] of [['z', 236, 194, 7], ['z z2', 231, 188, 9], ['z z3', 226, 182, 11]]) s += `<text class="${c}" x="${x}" y="${y}" font-family="Verdana" font-weight="bold" font-size="${fs}" fill="#fff" stroke="#24467a" stroke-width=".8">z</text>`;
  else s += `<path d="M266,190 C262,184 266,180 269,183 C272,180 276,184 272,190 L269,193 Z" fill="#ff6b8a" ${st(1)}/>`;
  save(awake ? 'puffle-wach' : 'puffle', s, '', css);
}

function pflanzen() {
  let s = '';
  // Monstera links
  const leaf = (x, y, rot, sc, c) => `<g transform="translate(${x},${y}) rotate(${rot}) scale(${sc})"><path d="M0,0 C-12,-8 -14,-28 0,-40 C14,-28 12,-8 0,0 Z" fill="${c}" ${st(1.6)}/><path d="M0,-2 V-36 M0,-12 L-7,-18 M0,-20 L7,-26 M0,-26 L-6,-31" fill="none" stroke="#2a6b30" stroke-width="1.2"/></g>`;
  s += leaf(14, 214, -38, 1.05, '#3f9a4a') + leaf(14, 214, 32, 1, '#47a852') + leaf(14, 214, -8, 1.25, '#3a8f44') + leaf(14, 216, 62, .85, '#4fb05a') + leaf(14, 216, -66, .8, '#45a250');
  s += `<path d="M1,218 L27,218 L23,242 L5,242 Z" fill="#c4693a" ${st(1.8)}/><rect x="-1" y="214" width="30" height="7" rx="2" fill="#d47a48" ${st(1.8)}/>`;
  // Kleine Tanne rechts mit Lichtern
  s += '<ellipse cx="585" cy="257" rx="18" ry="4" fill="#000" opacity=".25"/>';
  s += `<path d="M574,240 L596,240 L593,256 L577,256 Z" fill="#c4693a" ${st(1.8)}/><rect x="572" y="236" width="26" height="6" rx="2" fill="#d47a48" ${st(1.6)}/>`;
  s += `<rect x="582" y="226" width="6" height="12" fill="#6b3a1b" ${st(1.2)}/>`;
  for (const [y, w, h] of [[230, 22, 22], [214, 18, 22], [198, 13, 20]]) {
    s += `<path d="M585,${y - h} L${585 + w},${y} L${585 - w},${y} Z" fill="#2f7a4a" ${st(1.7)}/><path d="M585,${y - h} L${585 + w * .5},${y - h * .5} L${585 - w * .3},${y - h * .45} Z" fill="#3f9a5c"/>`;
    s += `<path d="M${585 - w + 3},${y - 1} C${585 - w / 2},${y - 5} ${585 + w / 2},${y - 3} ${585 + w - 3},${y - 1}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/>`;
  }
  s += `<path d="M585,172 L587.5,177 L593,177.6 L589,181.3 L590.2,186.8 L585,184 L579.8,186.8 L581,181.3 L577,177.6 L582.5,177 Z" fill="#ffd34d" ${st(1.1)}/>`;
  const lc = ['#ff5a5a', '#ffd34d', '#5aa8ff', '#5ad16a'];
  [[578, 224], [592, 220], [583, 208], [580, 194], [590, 200], [586, 186], [574, 228], [596, 226]].forEach(([x, y], i) =>
    (s += `<circle class="tw" style="animation-delay:-${f(i * .37)}s" cx="${x}" cy="${y}" r="1.9" fill="${lc[i % 4]}" ${st(0.6)}/>`));
  save('pflanzen', s, '', CSS_TW);
}

bg(); kamin(); regal(); schalter(); lichter();
sofa(); sessel(); grammophon(); tisch(); sack1(); sack2(); spieltisch(); hocker(); kakao(); puffle(false); puffle(true); pflanzen();
