// Raum: Zeichnen der Pinguine, Klick-Laufen, Sync ueber Socket.io
var Room = (function () {
  var COLORS = { blau:'#1e5bd6', rot:'#d61e1e', gruen:'#1ea83a', gelb:'#e8c31a', pink:'#e85bb5', lila:'#7a3ad6', schwarz:'#222222', orange:'#f07a10' };
  var W = 600, H = 400, FLOOR_Y = 170, SPEED = 130; // px pro Sekunde
  var last = 0;
  var canvas, ctx, socket, myId, onUsers, onClickPlayer, roomEl;
  var players = {}; // id -> { nick, color, x, y, tx, ty, dir, step }

  function init(sock, opts) {
    socket = sock;
    onUsers = opts.onUsers;
    onClickPlayer = opts.onClickPlayer;
    var room = roomEl = document.getElementById('room');
    room.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    room.appendChild(canvas);
    ctx = canvas.getContext('2d');
    canvas.onclick = handleClick;

    socket.on('welcome', function (d) {
      myId = d.me.id; players = {};
      d.players.forEach(add);
      changed();
    });
    socket.on('playerJoined', function (p) { add(p); changed(); });
    socket.on('playerLeft', function (id) { if (players[id]) removeBubble(players[id]); delete players[id]; changed(); });
    socket.on('playerMoved', function (m) {
      var p = players[m.id]; if (!p) return;
      p.tx = m.x; p.ty = m.y;
    });
    setInterval(update, 30);
    requestAnimationFrame(loop);
  }

  function add(p) { players[p.id] = { id:p.id, nick:p.nick, color:p.color, bot:p.bot, x:p.x, y:p.y, tx:p.x, ty:p.y, dir:1, step:0 }; }
  function changed() { if (onUsers) onUsers(list()); }
  function list() { return Object.keys(players).map(function (k) { return players[k]; }); }

  function handleClick(e) {
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    // Klick auf einen anderen Pingu?
    var hit = list().filter(function (p) { return p.id !== myId && Math.abs(p.x - x) < 20 && y > p.y - 50 && y < p.y + 5; })[0];
    if (hit) { if (onClickPlayer) onClickPlayer(hit, e.pageX, e.pageY); e.stopPropagation(); return; }
    if (y < FLOOR_Y) y = FLOOR_Y;
    socket.emit('move', { x: x, y: y });
  }

  // Bewegung zeitbasiert (laeuft auch weiter, wenn der Tab gedrosselt wird)
  function update() {
    var now = Date.now(), dt = last ? Math.min((now - last) / 1000, 1) : 0, step = SPEED * dt;
    last = now;
    list().forEach(function (p) {
      var dx = p.tx - p.x, dy = p.ty - p.y, d = Math.sqrt(dx*dx + dy*dy);
      if (d > step) { p.x += dx / d * step; p.y += dy / d * step; p.step += dt * 20; if (Math.abs(dx) > 1) p.dir = dx > 0 ? 1 : -1; }
      else { p.x = p.tx; p.y = p.ty; p.step = 0; }
    });
  }
  function loop() { update(); draw(); placeBubbles(); requestAnimationFrame(loop); }

  // Sprechblasen als HTML ueber dem Canvas (damit Emoji-Bilder gehen)
  function say(id, html) {
    var p = players[id]; if (!p) return;
    removeBubble(p);
    var b = document.createElement('div');
    b.className = 'bubble'; b.innerHTML = html;
    roomEl.appendChild(b);
    p.bubble = b;
    p.bubbleTimer = setTimeout(function () { removeBubble(p); }, 6000);
    placeBubbles();
  }
  function removeBubble(p) {
    if (p.bubble && p.bubble.parentNode) p.bubble.parentNode.removeChild(p.bubble);
    clearTimeout(p.bubbleTimer); p.bubble = null;
  }
  function placeBubbles() {
    list().forEach(function (p) {
      if (!p.bubble) return;
      var b = p.bubble, w = b.offsetWidth, h = b.offsetHeight;
      b.style.left = Math.max(2, Math.min(W - w - 2, p.x - w / 2)) + 'px';
      b.style.top = Math.max(2, p.y - 66 - h) + 'px';
    });
  }
  function byNick(n) { n = String(n).toLowerCase(); return list().filter(function (p) { return p.nick.toLowerCase() === n; })[0]; }

  function draw() {
    drawBackground();
    list().sort(function (a, b) { return a.y - b.y; }).forEach(drawPingu);
  }

  function drawBackground() {
    var g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    g.addColorStop(0, '#5d8fd8'); g.addColorStop(1, '#bfe0ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, FLOOR_Y);
    // Berge
    ctx.fillStyle = '#e8f2fb';
    tri(0, FLOOR_Y, 120, 60, 260, FLOOR_Y); tri(180, FLOOR_Y, 330, 40, 480, FLOOR_Y); tri(400, FLOOR_Y, 520, 75, 640, FLOOR_Y);
    // Haeuser
    house(40, 95, 110, 75, '#8b5a2b', 'Cafe');
    house(450, 100, 120, 70, '#6b6bb0', 'Disco');
    // Boden
    ctx.fillStyle = '#f4f9ff'; ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    ctx.fillStyle = '#dbe9f6';
    ctx.beginPath(); ctx.ellipse(300, 300, 180, 50, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a7da8'; ctx.font = 'bold 11px Verdana'; ctx.textAlign = 'center';
    ctx.fillText('~ Dorfplatz ~', 300, 304);
  }
  function tri(x1, y1, x2, y2, x3, y3) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.fill(); }
  function house(x, y, w, h, col, label) {
    ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fff'; tri(x - 8, y, x + w / 2, y - 30, x + w + 8, y);
    ctx.fillStyle = '#3a2410'; ctx.fillRect(x + w / 2 - 12, y + h - 35, 24, 35);
    ctx.fillStyle = '#ffe680'; ctx.fillRect(x + 10, y + 12, 20, 16); ctx.fillRect(x + w - 30, y + 12, 20, 16);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Verdana'; ctx.textAlign = 'center'; ctx.fillText(label, x + w / 2, y + 8 + 0);
  }

  function drawPingu(p) {
    var x = p.x, y = p.y, c = COLORS[p.color] || COLORS.blau;
    var bob = p.step ? Math.sin(p.step) * 2 : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(p.dir, 1);
    // Schatten
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 4, 0, 0, Math.PI*2); ctx.fill();
    // Fuesse
    ctx.fillStyle = '#f5a623';
    ctx.beginPath(); ctx.ellipse(-6, -2 + (p.step ? bob : 0), 6, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, -2 - (p.step ? bob : 0), 6, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.translate(0, -bob * 0.5);
    // Koerper
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -22, 15, 20, 0, 0, Math.PI*2); ctx.fill();
    // Fluegel
    ctx.beginPath(); ctx.ellipse(-14, -20, 4, 11, 0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14, -20, 4, 11, -0.3, 0, Math.PI*2); ctx.fill();
    // Bauch
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(2, -18, 10, 14, 0, 0, Math.PI*2); ctx.fill();
    // Kopf
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, -44, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(4, -43, 7, 8, 0, 0, Math.PI*2); ctx.fill();
    // Augen
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(2, -46, 1.8, 0, Math.PI*2); ctx.arc(8, -46, 1.8, 0, Math.PI*2); ctx.fill();
    // Schnabel
    ctx.fillStyle = '#f5a623'; tri(3, -42, 15, -40, 3, -38);
    ctx.restore();
    // Name
    ctx.font = 'bold 10px Verdana'; ctx.textAlign = 'center';
    var w = ctx.measureText(p.nick).width + 8;
    ctx.fillStyle = p.id === myId ? 'rgba(255,255,160,.9)' : 'rgba(255,255,255,.85)';
    ctx.fillRect(x - w/2, y + 4, w, 13);
    ctx.strokeStyle = '#7a8aa0'; ctx.strokeRect(x - w/2 + .5, y + 4.5, w - 1, 12);
    ctx.fillStyle = '#000'; ctx.fillText(p.nick, x, y + 14);
  }

  return { init: init, say: say, nick: function () { return players[myId] ? players[myId].nick : ''; }, byNick: byNick, players: function () { return players; }, myId: function () { return myId; }, COLORS: COLORS };
})();
