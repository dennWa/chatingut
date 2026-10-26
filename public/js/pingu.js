// Pinguin-Grafik im Club-Penguin-Stil (SVG). Farbe kommt per CSS-Variablen (--c, --cd, --cl).
// Ansichten: vorne, hinten, seitlich (nach rechts; links = gespiegelt) + Sitz-Fuesse, Tasse, Winken.
var Pingu = (function () {
  var COLORS = { blau:'#1897d3', rot:'#d8302f', gruen:'#35a643', gelb:'#f2c41a', pink:'#f173b6', lila:'#8a4fd8', schwarz:'#3a404c', orange:'#f5861f' };
  var K = 'stroke="#14141c" stroke-linejoin="round" stroke-linecap="round"';

  function mix(hex, to, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var h = function (v, t) { return ('0' + Math.round(v + (t - v) * f).toString(16)).slice(-2); };
    return '#' + h(r, to) + h(g, to) + h(b, to);
  }
  function vars(color) {
    var c = COLORS[color] || COLORS.blau;
    return '--c:' + c + ';--cd:' + mix(c, 0, 0.28) + ';--cl:' + mix(c, 255, 0.35);
  }

  var FEET = '<g class="feet">' +
    '<g class="fl"><path d="M49,103 C40,101 22,102 17,108 C13,113 17,118 29,118 L46,118 C51,118 52,106 49,103 Z" fill="#f7a21b" ' + K + ' stroke-width="2.2"/>' +
    '<path d="M24,108 C30,104 40,104 46,106 C40,108 30,108 24,108 Z" fill="#ffc83a"/></g>' +
    '<g class="fr"><path d="M51,103 C60,101 78,102 83,108 C87,113 83,118 71,118 L54,118 C49,118 48,106 51,103 Z" fill="#f7a21b" ' + K + ' stroke-width="2.2"/>' +
    '<path d="M76,108 C70,104 60,104 54,106 C60,108 70,108 76,108 Z" fill="#ffc83a"/></g></g>';
  var SITFEET = '<g class="sitfeet">' +
    '<ellipse cx="36" cy="111" rx="13" ry="7.5" fill="#f7a21b" ' + K + ' stroke-width="2.2"/><ellipse cx="34" cy="108.5" rx="8" ry="3" fill="#ffc83a"/>' +
    '<ellipse cx="64" cy="111" rx="13" ry="7.5" fill="#f7a21b" ' + K + ' stroke-width="2.2"/><ellipse cx="66" cy="108.5" rx="8" ry="3" fill="#ffc83a"/></g>';
  var BODY = 'M50,4 C66,4 74,14 75,30 C76,44 80,58 85,74 C90,92 86,108 68,110 L32,110 C14,108 10,92 15,74 C20,58 24,44 25,30 C26,14 34,4 50,4 Z';
  var FLIP_L = '<g class="fll"><path class="c" d="M28,42 C20,56 11,74 6,93 C5,99 9,101 12,97 C18,88 25,80 31,72 Z" ' + K + ' stroke-width="2.2"/>' +
    '<path class="cd" d="M24,60 C18,72 12,84 9,94 C14,86 20,79 27,71 Z"/></g>';
  var FLIP_R = '<g class="flr"><path class="c" d="M72,42 C80,56 89,74 94,93 C95,99 91,101 88,97 C82,88 75,80 69,72 Z" ' + K + ' stroke-width="2.2"/>' +
    '<path class="cd" d="M76,60 C82,72 88,84 91,94 C86,86 80,79 73,71 Z"/></g>';
  var MUG = '<g class="mug"><path d="M84,80 C88,74 86,68 90,62" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/>' +
    '<rect x="78" y="80" width="13" height="15" rx="2" fill="#d63a3a" ' + K + ' stroke-width="1.6"/>' +
    '<path d="M91,84 C96,84 96,92 91,92" fill="none" ' + K + ' stroke-width="1.8"/>' +
    '<ellipse cx="84.5" cy="80.5" rx="5.5" ry="1.6" fill="#7a4020"/><rect x="81" y="78" width="3" height="3" fill="#fff"/><rect x="85" y="77.5" width="3" height="3" fill="#ffe0ea"/></g>';

  var FRONT = '<g class="v-front">' + FEET + SITFEET +
    '<g class="bod"><path class="c" d="' + BODY + '" ' + K + ' stroke-width="2.4"/>' +
    '<path class="cl" d="M33,14 C29,22 28,30 28,40 C31,30 34,21 39,14 Z"/>' +
    '<path class="cd" d="M80,70 C85,84 86,100 72,108 C79,96 81,84 80,70 Z"/>' +
    '<path d="M50,50 C64,50 72,62 74,76 C77,94 70,106 50,107 C30,106 23,94 26,76 C28,62 36,50 50,50 Z" fill="#fff" ' + K + ' stroke-width="1.6"/>' +
    '<path d="M27,88 C34,100 66,100 73,88 C72,100 64,106 50,106 C36,106 28,100 27,88 Z" fill="#d4d4d8"/>' +
    '<ellipse cx="50" cy="55" rx="15" ry="5" fill="#cfd0d6"/>' +
    '<path d="M50,21 C46,15 36,15 34,23 C32,31 34,41 40,46 L60,46 C66,41 68,31 66,23 C64,15 54,15 50,21 Z" fill="#fff" ' + K + ' stroke-width="1.6"/>' +
    '<ellipse cx="44" cy="31" rx="3.2" ry="4.5" fill="#14141c"/><ellipse cx="56" cy="31" rx="3.2" ry="4.5" fill="#14141c"/>' +
    '<circle cx="45.2" cy="29.4" r="1.1" fill="#fff"/><circle cx="57.2" cy="29.4" r="1.1" fill="#fff"/>' +
    '<path d="M50,36 C60,36 67,40 67,46 C67,53 59,56 50,56 C41,56 33,53 33,46 C33,40 40,36 50,36 Z" fill="#f7a21b" ' + K + ' stroke-width="2"/>' +
    '<path d="M36,49 C42,55 58,55 64,49 C62,54 56,56 50,56 C44,56 38,54 36,49 Z" fill="#e2800f"/>' +
    '<path d="M38,42 C42,38 58,38 62,42 C58,44.5 42,44.5 38,42 Z" fill="#ffca40"/>' +
    '<path d="M38,47 C44,52 55,52 61,46.5" fill="none" ' + K + ' stroke-width="1.5"/></g>' +
    FLIP_L + FLIP_R + MUG + '</g>';

  var BACK = '<g class="v-back">' +
    '<path d="M22,108 C20,114 26,118 34,117 L44,116 Z M78,108 C80,114 74,118 66,117 L56,116 Z" fill="#f7a21b" ' + K + ' stroke-width="2"/>' +
    '<g class="bod"><path class="c" d="' + BODY + '" ' + K + ' stroke-width="2.4"/>' +
    '<path class="cl" d="M33,14 C29,22 28,30 28,40 C31,30 34,21 39,14 Z"/>' +
    '<path class="cd" d="M20,80 C16,92 20,104 32,108 C26,98 22,90 20,80 Z M80,70 C85,84 86,100 72,108 C79,96 81,84 80,70 Z"/>' +
    '<path class="cd" d="M44,104 L50,112 L56,104 Z" ' + K + ' stroke-width="1.4"/></g>' +
    FLIP_L + FLIP_R + '</g>';

  var SIDE = '<g class="v-side">' +
    '<g class="feet"><g class="fl"><path d="M34,106 C48,104 66,104 74,109 C78,113 75,118 66,118 L34,118 C28,118 28,108 34,106 Z" fill="#e2850f" ' + K + ' stroke-width="2.2"/></g>' +
    '<g class="fr"><path d="M38,106 C52,104 72,104 80,109 C84,113 81,118 72,118 L38,118 C32,118 32,108 38,106 Z" fill="#f7a21b" ' + K + ' stroke-width="2.2"/>' +
    '<path d="M44,108 C56,106 68,106 76,109 C68,110 56,110 44,108 Z" fill="#ffc83a"/></g></g>' +
    '<g class="sitfeet"><path d="M40,104 C54,102 76,104 84,108 C88,112 84,117 74,117 L40,117 C34,117 34,106 40,104 Z" fill="#f7a21b" ' + K + ' stroke-width="2.2"/>' +
    '<path d="M46,106 C58,105 72,105 80,108 C70,109 58,109 46,106 Z" fill="#ffc83a"/></g>' +
    '<g class="bod"><path class="c" d="M44,4 C60,4 69,14 70,30 C71,44 75,58 80,74 C84,92 78,108 62,110 L32,110 C16,108 12,94 16,78 C20,62 25,46 26,30 C27,14 32,4 44,4 Z" ' + K + ' stroke-width="2.4"/>' +
    '<path class="cl" d="M31,14 C27,24 27,34 28,44 C30,32 33,22 37,14 Z"/>' +
    '<path d="M59,46 C70,52 77,66 79,80 C81,96 74,106 60,108 C66,92 66,66 59,46 Z" fill="#fff" ' + K + ' stroke-width="1.6"/>' +
    '<path d="M70,96 C74,100 70,106 60,108 C64,104 66,100 66,96 Z" fill="#d4d4d8"/>' +
    '<ellipse cx="59" cy="27" rx="7.5" ry="10" fill="#fff" ' + K + ' stroke-width="1.5"/>' +
    '<ellipse cx="61" cy="26" rx="3" ry="4.4" fill="#14141c"/><circle cx="62" cy="24.4" r="1.1" fill="#fff"/>' +
    '<path d="M63,33 C72,31 84,35 87,40 C84,46 72,48 62,46 Z" fill="#f7a21b" ' + K + ' stroke-width="2"/>' +
    '<path d="M65,35 C72,34 80,36 84,39 C76,40 70,40 65,38 Z" fill="#ffca40"/>' +
    '<path d="M66,42 C72,44 80,43 85,40.5" fill="none" ' + K + ' stroke-width="1.4"/></g>' +
    '<g class="fls"><path class="c" d="M40,44 C33,60 29,76 31,92 C32,97 37,97 38,92 C40,78 46,62 49,49 Z" ' + K + ' stroke-width="2.2"/>' +
    '<path class="cd" d="M36,70 C33,80 32,88 33,93 C35,84 38,76 41,68 Z"/></g>' +
    '<g transform="translate(-14,4)">' + MUG + '</g></g>';

  var SVG = '<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">' +
    '<ellipse class="shadow" cx="50" cy="115" rx="33" ry="5.5" fill="#000" opacity=".2"/>' + FRONT + BACK + SIDE + '</svg>';

  return { COLORS: COLORS, vars: vars, svg: function () { return SVG; } };
})();
