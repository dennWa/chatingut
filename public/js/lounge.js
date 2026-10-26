// Lounge: Karte, Ebenen, Sitzplaetze, Objekte und Wegfindung (laeuft im Browser UND auf dem Server)
(function (root) {
  var W = 600, H = 400, MIN_X = 12, MAX_X = 588, MIN_Y = 212, MAX_Y = 394, CELL = 6, PAD = 4;

  // Grafik-Ebenen (public/img/lounge/*.svg), z = Zeichenreihenfolge (Pinguine haben z = y)
  var PROPS = [
    { id: 'bg', z: 0 }, { id: 'kamin', z: 1 }, { id: 'regal', z: 1 }, { id: 'schalter', z: 2 }, { id: 'lichter', z: 3 },
    { id: 'puffle', z: 226 }, { id: 'pflanzen', z: 240 }, { id: 'sofa', z: 250 }, { id: 'sessel', z: 250 },
    { id: 'grammophon', z: 266 }, { id: 'tisch', z: 296 }, { id: 'sack1', z: 312 }, { id: 'hocker', z: 340 },
    { id: 'kakao', z: 345 }, { id: 'sack2', z: 362 }, { id: 'spieltisch', z: 376 }
  ];

  // Bodenflaechen der Moebel: r = Rechteck [x1,y1,x2,y2], e = Ellipse [cx,cy,rx,ry]
  var BLOCK = [
    { r: [22, 200, 222, 278] },  // Sofa
    { r: [372, 200, 448, 272] }, // Sessel
    { r: [448, 200, 494, 270] }, // Grammophon
    { e: [300, 294, 50, 13] },   // Couchtisch
    { e: [538, 318, 36, 12] },   // Sitzsack rosa
    { e: [214, 368, 36, 11] },   // Sitzsack blau
    { e: [470, 366, 34, 11] },   // Spieltisch
    { e: [428, 364, 15, 7] }, { e: [512, 364, 15, 7] }, // Hocker
    { r: [14, 316, 136, 380] },  // Kakao-Bude
    { e: [250, 222, 24, 10] },   // Puffle-Korb
    { r: [0, 200, 28, 248] },    // Pflanze links
    { e: [585, 252, 18, 8] }     // Tanne rechts
  ];

  // Sitzplaetze: x/y = Sitzpunkt, ax/ay = Stelle davor, face = Blickrichtung
  var SEATS = {
    sofa1: { x: 79, y: 256, ax: 79, ay: 288, face: 'front' },
    sofa2: { x: 125, y: 256, ax: 125, ay: 288, face: 'front' },
    sofa3: { x: 171, y: 256, ax: 171, ay: 288, face: 'front' },
    sessel: { x: 410, y: 258, ax: 410, ay: 288, face: 'front' },
    sack1: { x: 538, y: 318, ax: 538, ay: 344, face: 'front' },
    sack2: { x: 214, y: 368, ax: 258, ay: 372, face: 'front' },
    hocker1: { x: 430, y: 364, ax: 398, ay: 366, face: 'right' },
    hocker2: { x: 510, y: 364, ax: 544, ay: 366, face: 'left' }
  };

  // Klickbare Objekte (Reihenfolge = Prioritaet). seats -> hinsetzen, use -> Server-Aktion, local -> nur im Browser
  var OBJECTS = [
    { id: 'puffle', name: 'Puffle streicheln', prop: 'puffle', hit: [226, 180, 274, 234], use: true, ax: 272, ay: 248 },
    { id: 'licht', name: 'Lichtschalter', prop: 'schalter', hit: [570, 104, 592, 132], use: true, ax: 560, ay: 226 },
    { id: 'radio', name: 'Grammophon: Musik an/aus', prop: 'grammophon', hit: [442, 170, 496, 270], use: true, ax: 472, ay: 290 },
    { id: 'kamin', name: 'Kamin: Flossen wärmen', prop: 'kamin', hit: [222, 84, 378, 206], use: true, ax: 300, ay: 228 },
    { id: 'regal', name: 'Bücherregal: ein Buch lesen', prop: 'regal', hit: [428, 16, 572, 192], local: true, ax: 522, ay: 224 },
    { id: 'sofa', name: 'Kuschelsofa: hinsetzen', prop: 'sofa', hit: [24, 190, 222, 276], seats: ['sofa1', 'sofa2', 'sofa3'] },
    { id: 'sessel', name: 'Ohrensessel: hinsetzen', prop: 'sessel', hit: [372, 182, 448, 274], seats: ['sessel'] },
    { id: 'sack1', name: 'Sitzsack: reinplumpsen', prop: 'sack1', hit: [500, 276, 578, 332], seats: ['sack1'] },
    { id: 'sack2', name: 'Sitzsack: reinplumpsen', prop: 'sack2', hit: [176, 330, 254, 380], seats: ['sack2'] },
    { id: 'spieltisch', name: 'Spieltisch (TicTacToe): hinsetzen', prop: 'spieltisch', hit: [412, 338, 528, 382], seats: ['hocker1', 'hocker2'] },
    { id: 'kakao', name: 'Kakao-Bude: heißen Kakao holen', prop: 'kakao', hit: [16, 252, 136, 378], use: true, ax: 148, ay: 350 },
    { id: 'kekse', name: 'Kekse naschen', prop: 'tisch', hit: [254, 262, 346, 304], use: true, ax: 300, ay: 318 }
  ];
  var OBJ = {};
  OBJECTS.forEach(function (o) { OBJ[o.id] = o; });

  // Lichtquellen fuer "Licht gedimmt" (r = Radius, c = RGB)
  var LIGHTS = [
    { x: 300, y: 158, r: 140, c: '255,140,40', flick: true }, { x: 210, y: 100, r: 46, c: '255,214,130' },
    { x: 402, y: 96, r: 46, c: '255,214,130' }, { x: 235, y: 68, r: 24, c: '255,200,110', flick: true },
    { x: 365, y: 68, r: 24, c: '255,200,110', flick: true }, { x: 110, y: 96, r: 78, c: '120,150,255' },
    { x: 262, y: 266, r: 34, c: '255,190,90', flick: true }, { x: 150, y: 134, r: 20, c: '255,200,110', flick: true },
    { x: 585, y: 205, r: 36, c: '255,210,120' }, { x: 75, y: 32, r: 44, c: '255,190,120' }, { x: 225, y: 32, r: 44, c: '255,190,120' },
    { x: 375, y: 32, r: 44, c: '255,190,120' }, { x: 525, y: 32, r: 44, c: '255,190,120' }
  ];

  function blocked(x, y, pad) {
    for (var i = 0; i < BLOCK.length; i++) {
      var b = BLOCK[i];
      if (b.r) { if (x > b.r[0] - pad && x < b.r[2] + pad && y > b.r[1] - pad && y < b.r[3] + pad) return true; }
      else {
        var dx = (x - b.e[0]) / (b.e[2] + pad), dy = (y - b.e[1]) / (b.e[3] + pad);
        if (dx * dx + dy * dy < 1) return true;
      }
    }
    return false;
  }
  function walkable(x, y) { return x >= MIN_X && x <= MAX_X && y >= MIN_Y && y <= MAX_Y && !blocked(x, y, PAD); }

  // Raster fuer die Wegsuche
  var GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL), grid = [];
  for (var gy = 0; gy < GH; gy++) for (var gx = 0; gx < GW; gx++) grid.push(walkable(gx * CELL + CELL / 2, gy * CELL + CELL / 2));
  var cx = function (i) { return (i % GW) * CELL + CELL / 2; }, cy = function (i) { return Math.floor(i / GW) * CELL + CELL / 2; };
  var cellOf = function (x, y) { return Math.floor(y / CELL) * GW + Math.floor(x / CELL); };

  function nearestWalkable(x, y) {
    x = Math.max(MIN_X, Math.min(MAX_X, x)); y = Math.max(MIN_Y, Math.min(MAX_Y, y));
    if (walkable(x, y)) return { x: Math.round(x), y: Math.round(y) };
    var best = null, bd = Infinity;
    for (var i = 0; i < grid.length; i++) {
      if (!grid[i]) continue;
      var d = (cx(i) - x) * (cx(i) - x) + (cy(i) - y) * (cy(i) - y);
      if (d < bd) { bd = d; best = i; }
    }
    return { x: cx(best), y: cy(best) };
  }

  function lineFree(a, b) {
    var d = Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y)), n = Math.ceil(d / 3);
    for (var i = 1; i < n; i++) if (!walkable(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n)) return false;
    return true;
  }

  // A* ueber das Raster, danach Wegpunkte glaetten. Ergebnis: Liste von Punkten (ohne Start)
  function findPath(sx, sy, tx, ty) {
    var start = { x: sx, y: sy }, goal = { x: tx, y: ty };
    if (lineFree(start, goal)) return [goal];
    var s = nearestWalkable(sx, sy), t = nearestWalkable(tx, ty);
    var si = cellOf(s.x, s.y), ti = cellOf(t.x, t.y);
    if (!grid[si] || !grid[ti]) return [goal];
    var open = [si], g = {}, from = {}, f = {}, closed = {};
    g[si] = 0; f[si] = 0;
    var h = function (i) { var dx = Math.abs(cx(i) - cx(ti)), dy = Math.abs(cy(i) - cy(ti)); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    while (open.length) {
      var bi = 0;
      for (var k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
      var cur = open[bi];
      if (cur === ti) break;
      open.splice(bi, 1); closed[cur] = true;
      var gx0 = cur % GW, gy0 = Math.floor(cur / GW);
      for (var ddy = -1; ddy <= 1; ddy++) for (var ddx = -1; ddx <= 1; ddx++) {
        if (!ddx && !ddy) continue;
        var nx = gx0 + ddx, ny = gy0 + ddy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        var ni = ny * GW + nx;
        if (!grid[ni] || closed[ni]) continue;
        if (ddx && ddy && (!grid[gy0 * GW + nx] || !grid[ny * GW + gx0])) continue; // keine Ecken schneiden
        var ng = g[cur] + (ddx && ddy ? 1.414 : 1) * CELL;
        if (g[ni] === undefined || ng < g[ni]) {
          if (g[ni] === undefined) open.push(ni);
          g[ni] = ng; f[ni] = ng + h(ni); from[ni] = cur;
        }
      }
    }
    if (g[ti] === undefined) return [goal];
    var cells = [];
    for (var c = ti; c !== si; c = from[c]) cells.unshift({ x: cx(c), y: cy(c) });
    var pts = [start].concat(cells, [goal]), out = [], i = 0;
    while (i < pts.length - 1) {
      var j = pts.length - 1;
      while (j > i + 1 && !lineFree(pts[i], pts[j])) j--;
      out.push(pts[j]); i = j;
    }
    return out;
  }

  function objectAt(x, y) {
    for (var i = 0; i < OBJECTS.length; i++) {
      var h = OBJECTS[i].hit;
      if (x >= h[0] && x <= h[2] && y >= h[1] && y <= h[3]) return OBJECTS[i];
    }
    return null;
  }

  // Groesse der Pingus je nach Tiefe (hinten kleiner)
  function scaleAt(y) { return 0.82 + Math.max(0, Math.min(1, (y - MIN_Y) / (MAX_Y - MIN_Y))) * 0.22; }

  var Lounge = {
    W: W, H: H, MIN_X: MIN_X, MAX_X: MAX_X, MIN_Y: MIN_Y, MAX_Y: MAX_Y,
    PROPS: PROPS, SEATS: SEATS, OBJECTS: OBJECTS, OBJ: OBJ, LIGHTS: LIGHTS,
    walkable: walkable, nearestWalkable: nearestWalkable, findPath: findPath, objectAt: objectAt, scaleAt: scaleAt
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Lounge;
  else root.Lounge = Lounge;
})(this);
