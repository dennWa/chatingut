// Alte Pixel-Smileys (15x15), zur Laufzeit per Canvas erzeugt
var Emoji = (function () {
  var S = 15, Y = '#ffd800', O = '#7a5200', K = '#000', R = '#d40000', B = '#2a8cff', Wt = '#fff';
  var SMILE = [[4,9],[5,10],[6,10],[7,10],[8,10],[9,10],[10,9]];
  var FROWN = [[4,11],[5,10],[6,10],[7,10],[8,10],[9,10],[10,11]];
  var EYES = [[5,5],[5,6],[9,5],[9,6]];
  var GRIN = [[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[5,10],[6,10],[7,10],[8,10],[9,10],[6,11],[7,11],[8,11]];

  // Code -> [Name, Gesichtsfarbe, [[Farbe, Pixel], ...]]
  var DEFS = [
    [':)',  'laecheln',  Y, [[K, EYES.concat(SMILE)]]],
    [';)',  'zwinkern',  Y, [[K, [[4,6],[5,6],[6,6],[9,5],[9,6]].concat(SMILE)]]],
    [':D',  'grinsen',   Y, [[K, EYES.concat(GRIN)]]],
    ['xD',  'lachen',    Y, [[K, [[4,4],[6,4],[5,5],[4,6],[6,6],[8,4],[10,4],[9,5],[8,6],[10,6]].concat(GRIN)]]],
    [':P',  'zunge',     Y, [[K, EYES.concat([[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9]])], [R, [[7,10],[8,10],[7,11],[8,11]]]]],
    [':(',  'traurig',   Y, [[K, EYES.concat(FROWN)]]],
    [":'(", 'weinen',    Y, [[K, EYES.concat(FROWN)], [B, [[4,7],[4,8],[3,9]]]]],
    [':O',  'staunen',   Y, [[K, EYES.concat([[6,9],[7,9],[8,9],[6,10],[8,10],[6,11],[7,11],[8,11]])]]],
    ['8)',  'cool',      Y, [[K, [[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[3,6],[4,6],[5,6],[6,6],[8,6],[9,6],[10,6],[11,6],[4,7],[5,7],[9,7],[10,7]].concat(SMILE)]]],
    [':@',  'wuetend',   '#ff6a3d', [[K, [[4,4],[5,5],[10,4],[9,5]].concat(EYES).concat(FROWN)]]],
    [':|',  'neutral',   Y, [[K, EYES.concat([[5,10],[6,10],[7,10],[8,10],[9,10]])]]],
    ['^^',  'freuen',    Y, [[K, [[4,6],[5,5],[6,6],[8,6],[9,5],[10,6]].concat(SMILE)]]],
    ['<3',  'herz',      null, [[R, heart()]]],
  ];

  function heart() {
    var rows = ['..XXX...XXX..', '.XXXXX.XXXXX.', 'XXXXXXXXXXXXX', 'XXXXXXXXXXXXX', 'XXXXXXXXXXXXX', '.XXXXXXXXXXX.', '..XXXXXXXXX..', '...XXXXXXX...', '....XXXXX....', '.....XXX.....', '......X......'];
    var px = [];
    rows.forEach(function (r, y) { for (var x = 0; x < r.length; x++) if (r[x] === 'X') px.push([x + 1, y + 2]); });
    return px;
  }

  var images = {};
  function render(def) {
    var c = document.createElement('canvas'); c.width = c.height = S;
    var g = c.getContext('2d');
    if (def[2]) {
      for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
        var d = Math.sqrt((x - 7) * (x - 7) + (y - 7) * (y - 7));
        if (d <= 7.3) { g.fillStyle = d > 6.2 ? O : def[2]; g.fillRect(x, y, 1, 1); }
      }
      g.fillStyle = Wt; g.fillRect(4, 3, 1, 1); // Glanzpunkt
    }
    def[3].forEach(function (layer) {
      g.fillStyle = layer[0];
      layer[1].forEach(function (p) { g.fillRect(p[0], p[1], 1, 1); });
    });
    return c.toDataURL();
  }
  DEFS.forEach(function (d) { images[d[0]] = render(d); });

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function img(code) { return '<img class="emo" src="' + images[code] + '" alt="' + esc(code) + '" title="' + esc(code) + '">'; }

  // Text escapen und Smiley-Codes durch Bilder ersetzen
  var codes = DEFS.map(function (d) { return d[0]; }).sort(function (a, b) { return b.length - a.length; });
  var re = new RegExp('(' + codes.map(function (c) { return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'g');
  // Alternative Schreibweisen
  var ALIAS = { ':-)': ':)', ';-)': ';)', ':-D': ':D', ':-P': ':P', ':p': ':P', ':-(': ':(', ':-O': ':O', ':o': ':O', 'XD': 'xD', '8-)': '8)' };
  function parse(text) {
    text = String(text);
    for (var a in ALIAS) text = text.split(a).join(ALIAS[a]);
    return text.split(re).map(function (part) { return images[part] ? img(part) : esc(part); }).join('');
  }

  function bar(el, onPick) {
    DEFS.forEach(function (d) {
      var s = document.createElement('span');
      s.innerHTML = img(d[0]); s.title = d[0] + ' ' + d[1];
      s.onclick = function () { onPick(d[0]); };
      el.appendChild(s);
    });
  }

  return { parse: parse, esc: esc, bar: bar };
})();
