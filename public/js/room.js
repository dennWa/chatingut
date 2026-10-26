// Raum "Lounge": Grafik-Ebenen, Pinguine, Laufen mit Wegfindung, Sitzen, Objekte, Effekte, Sync per Socket.io
var Room = (function () {
  var L = Lounge, SPEED = 130; // px pro Sekunde
  var roomEl, socket, myId, onUsers, onClickPlayer;
  var players = {}, props = {}, room = {}, pending = null, hoverObj = null, last = 0, noteTimer = null;

  var BOOKS = [
    ['Die Eisscholle von Tante Frieda', 'Kapitel 1: Es war kalt. Kapitel 2: Es war immer noch kalt. Ein Klassiker!'],
    ['56k - Eine Liebesgeschichte', '"Piiieeep... krrrrrr... dong-dong..." - Sie wählte sich ein. Er war schon online. Es war Schicksal.'],
    ['Das große Puffle-Pflegebuch', 'Tipp 7: Puffles lieben Kekse. Tipp 8: Gib ihnen trotzdem nicht alle Kekse.'],
    ['Tuxis TicTacToe-Strategien', 'Seite 1: Nimm immer die Mitte. Seite 2-300: Siehe Seite 1.'],
    ['Gedichte am Kamin', 'Das Feuer knistert, der Kakao dampft, / der Pinguin hat sich ins Sofa gekrampft.'],
    ['Handbuch: Nokia 3310', 'Kapitel 4: Snake II - wie du deinen Highscore in der Mathestunde verbesserst.'],
    ['Mein MSN-Status und ich', '"~*~ chillen mit da crew ~*~ (B)(B) bin weg ~ oder doch nich?"']
  ];

  function init(sock, opts) {
    socket = sock;
    onUsers = opts.onUsers;
    onClickPlayer = opts.onClickPlayer;
    roomEl = document.getElementById('room');
    roomEl.innerHTML = '';
    L.PROPS.forEach(function (pr) {
      var img = document.createElement('img');
      img.src = 'img/lounge/' + pr.id + '.svg';
      img.className = 'prop'; img.alt = ''; img.draggable = false;
      img.style.zIndex = pr.z;
      roomEl.appendChild(img);
      props[pr.id] = img;
    });
    var dim = document.createElement('div');
    dim.className = 'dimmer';
    roomEl.appendChild(dim);
    L.LIGHTS.forEach(function (l) {
      var g = document.createElement('div');
      g.className = 'glowl' + (l.flick ? ' flick' : '');
      g.style.cssText = 'left:' + (l.x - l.r) + 'px;top:' + (l.y - l.r) + 'px;width:' + 2 * l.r + 'px;height:' + 2 * l.r + 'px;' +
        'background:radial-gradient(circle,rgba(' + l.c + ',.85) 0%,rgba(' + l.c + ',.32) 40%,rgba(' + l.c + ',0) 70%)';
      roomEl.appendChild(g);
    });
    roomEl.onclick = handleClick;
    roomEl.onmousemove = handleHover;
    roomEl.onmouseleave = function () { setHover(null); };

    socket.on('welcome', function (d) {
      for (var k in players) removeEl(players[k]);
      players = {};
      myId = d.me.id;
      d.players.forEach(add);
      setRoom(d.room || {});
      changed();
    });
    socket.on('playerJoined', function (p) { add(p); changed(); });
    socket.on('playerLeft', function (id) { if (players[id]) removeEl(players[id]); delete players[id]; changed(); });
    socket.on('playerMoved', function (m) { var p = players[m.id]; if (p) moveTo(p, m.x, m.y, m.seat); });
    socket.on('playerState', function (s) {
      var p = players[s.id]; if (!p) return;
      p.item = s.item; p.emote = s.emote;
      if (p.emote) { p.view = 'front'; p.left = false; }
    });
    socket.on('roomState', setRoom);
    socket.on('act', function (a) {
      if (a.type === 'knuddel') { hearts(a.to); hearts(a.from, 2); }
      else if (a.type === 'kamin') sparks();
      else if (a.type === 'puffle') wakePuffle();
      else if (a.type === 'kakao' || a.type === 'kekse') hearts(a.from, 1);
    });
    setInterval(update, 30);
    requestAnimationFrame(loop);
  }

  // ---------- Spieler ----------
  function add(p) {
    if (players[p.id]) removeEl(players[p.id]);
    var el = document.createElement('div');
    el.innerHTML = '<div class="fig" style="' + Pingu.vars(p.color) + '">' + Pingu.svg() + '</div><div class="name"></div>';
    el.querySelector('.name').textContent = p.nick;
    el.pid = p.id;
    roomEl.appendChild(el);
    var q = players[p.id] = { id: p.id, nick: p.nick, color: p.color, bot: p.bot, x: p.x, y: p.y, path: [], el: el,
      fig: el.querySelector('.fig'), view: 'front', left: false, seat: null, sitTarget: null, item: p.item, emote: p.emote };
    if (p.seat) sitDown(q, p.seat);
    render(q);
  }
  function removeEl(p) { removeBubble(p); if (p.el.parentNode) p.el.parentNode.removeChild(p.el); }
  function changed() { if (onUsers) onUsers(list()); }
  function list() { return Object.keys(players).map(function (k) { return players[k]; }); }

  function sitDown(p, seatId) {
    var s = L.SEATS[seatId];
    p.seat = seatId; p.sitTarget = null; p.path = [];
    p.x = s.x; p.y = s.y;
    p.view = s.face === 'front' ? 'front' : 'side';
    p.left = s.face === 'left';
  }

  // Neues Ziel: erst vom Platz aufstehen, dann Weg suchen, ggf. am Ende auf den Sitz huepfen
  function moveTo(p, x, y, seatId) {
    var path = [], fx = p.x, fy = p.y;
    if (p.seat) { var os = L.SEATS[p.seat]; path.push({ x: os.ax, y: os.ay }); fx = os.ax; fy = os.ay; }
    p.seat = null; p.sitTarget = seatId || null;
    if (seatId) {
      var s = L.SEATS[seatId];
      path = path.concat(L.findPath(fx, fy, s.ax, s.ay));
      path.push({ x: s.x, y: s.y });
    } else {
      path = path.concat(L.findPath(fx, fy, x, y));
    }
    p.path = path;
    if (p.id === myId && pending && !seatId && Math.abs(x - pending.x) < 2 && Math.abs(y - pending.y) < 2) pending.ok = true;
  }

  // ---------- Bewegung (zeitbasiert, laeuft auch weiter, wenn der Tab gedrosselt wird) ----------
  function update() {
    var now = Date.now(), dt = last ? Math.min((now - last) / 1000, 1) : 0;
    last = now;
    list().forEach(function (p) {
      var budget = SPEED * dt, moved = false;
      while (budget > 0 && p.path.length) {
        var t = p.path[0], dx = t.x - p.x, dy = t.y - p.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d > 0.5) face(p, dx, dy);
        if (d <= budget) { p.x = t.x; p.y = t.y; budget -= d; p.path.shift(); }
        else { p.x += dx / d * budget; p.y += dy / d * budget; budget = 0; }
        moved = true;
      }
      p.walking = moved || p.path.length > 0;
      if (!p.path.length && p.sitTarget) sitDown(p, p.sitTarget);
      if (p.id === myId && pending && pending.ok && !p.path.length) arrive(p);
    });
  }
  function face(p, dx, dy) {
    if (Math.abs(dy) > Math.abs(dx) * 1.2) { p.view = dy > 0 ? 'front' : 'back'; p.left = false; }
    else { p.view = 'side'; p.left = dx < 0; }
  }
  function loop() { update(); list().forEach(render); placeBubbles(); requestAnimationFrame(loop); }

  function render(p) {
    var s = L.scaleAt(p.y), tf = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
    if (p._tf !== tf) { p.el.style.transform = tf; p.el.style.zIndex = Math.round(p.y); p._tf = tf; }
    var fs = 'scale(' + s.toFixed(3) + ')';
    if (p._fs !== fs) { p.fig.style.transform = fs; p._fs = fs; }
    var cls = 'pg ' + p.view + (p.left ? ' left' : '') + (p.walking ? ' walk' : '') + (p.seat ? ' sit' : '') +
      (p.item ? ' ' + p.item : '') + (p.emote && !p.walking ? ' ' + p.emote : '') + (p.id === myId ? ' me' : '');
    if (p._cls !== cls) { p.el.className = cls; p._cls = cls; }
  }

  // ---------- Klicks + Objekte ----------
  function pos(e) {
    var r = roomEl.getBoundingClientRect();
    return { x: Math.round(e.clientX - r.left - roomEl.clientLeft), y: Math.round(e.clientY - r.top - roomEl.clientTop) };
  }
  function handleClick(e) {
    if (!myId || !players[myId]) return;
    Music.unlock();
    var pg = e.target.closest ? e.target.closest('.pg') : null;
    if (pg && players[pg.pid]) {
      e.stopPropagation();
      if (onClickPlayer) onClickPlayer(players[pg.pid], e.pageX, e.pageY);
      return;
    }
    var c = pos(e), o = L.objectAt(c.x, c.y);
    pending = null;
    if (o) return useObject(o);
    socket.emit('move', c);
  }
  function handleHover(e) {
    var pg = e.target.closest ? e.target.closest('.pg') : null;
    if (pg) return setHover(null);
    var c = pos(e);
    setHover(L.objectAt(c.x, c.y));
  }
  function setHover(o) {
    if (o === hoverObj) return;
    if (hoverObj) props[hoverObj.prop].classList.remove('hl');
    hoverObj = o;
    if (o) props[o.prop].classList.add('hl');
    roomEl.title = o ? o.name : '';
    roomEl.className = (o ? 'pointer' : '') + (room.dim ? ' dim' : '');
  }

  function seatTaken(id) {
    return list().some(function (p) { return p.id !== myId && (p.seat === id || p.sitTarget === id); });
  }
  function useObject(o) {
    var me = players[myId];
    if (o.seats) {
      if (me.seat && o.seats.indexOf(me.seat) >= 0) return;
      var free = o.seats.filter(function (s) { return !seatTaken(s); });
      if (!free.length) return Chat.sys('Hier ist leider schon alles besetzt!');
      free.sort(function (a, b) {
        var sa = L.SEATS[a], sb = L.SEATS[b];
        return Math.hypot(sa.ax - me.x, sa.ay - me.y) - Math.hypot(sb.ax - me.x, sb.ay - me.y);
      });
      var s = L.SEATS[free[0]];
      pending = { seat: free[0], x: s.ax, y: s.ay };
    } else {
      pending = { obj: o, x: o.ax, y: o.ay };
    }
    if (!me.seat && Math.abs(me.x - pending.x) < 2 && Math.abs(me.y - pending.y) < 2 && !me.path.length) { pending.ok = true; return; }
    socket.emit('move', { x: pending.x, y: pending.y });
  }
  function arrive(me) {
    var a = pending;
    pending = null;
    if (Math.abs(me.x - a.x) > 3 || Math.abs(me.y - a.y) > 3) return;
    if (a.seat) {
      socket.emit('sit', a.seat);
      if (a.seat.indexOf('hocker') === 0) Chat.sys('Du sitzt am Spieltisch. Klick auf einen Pingu und wähle "TicTacToe spielen"!');
    } else if (a.obj.local) {
      if (a.obj.id === 'regal') readBook();
    } else {
      socket.emit('use', a.obj.id);
    }
  }
  function readBook() {
    var b = BOOKS[Math.floor(Math.random() * BOOKS.length)];
    var w = Win.create('Bücherregal', { width: 280 });
    w.body.innerHTML = '<p><b></b></p><p style="font-style:italic"></p><button>Zuklappen</button>';
    w.body.querySelector('b').textContent = '"' + b[0] + '"';
    w.body.querySelectorAll('p')[1].textContent = b[1];
    w.body.querySelector('button').onclick = w.close;
    Snd.play('Windows Navigation Start', 0.4);
  }

  // ---------- Raumzustand + Effekte ----------
  function setRoom(r) {
    var wasDim = room.dim;
    room = r || {};
    roomEl.classList.toggle('dim', !!room.dim);
    if (wasDim !== undefined && wasDim !== room.dim) Snd.play('Windows Navigation Start', 0.5);
    Music.set(!!room.radio);
    clearInterval(noteTimer);
    if (room.radio) noteTimer = setInterval(function () { fx('note', Math.random() < 0.5 ? '♪' : '♫', 448 + Math.random() * 14, 178, -20 + Math.random() * 10); }, 700);
  }
  function fx(cls, text, x, y, dx) {
    var e = document.createElement('div');
    e.className = 'fx ' + cls;
    e.textContent = text || '';
    e.style.left = x + 'px'; e.style.top = y + 'px';
    e.style.setProperty('--dx', (dx || 0) + 'px');
    roomEl.appendChild(e);
    setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 2700);
  }
  function hearts(id, n) {
    var p = players[id]; if (!p) return;
    var top = p.y - 64 * L.scaleAt(p.y);
    for (var i = 0; i < (n || 6); i++) {
      (function (i) { setTimeout(function () { fx('heart', '♥', p.x - 8 + (Math.random() - 0.5) * 30, top + Math.random() * 10, (Math.random() - 0.5) * 30); }, i * 140); })(i);
    }
  }
  function sparks() {
    for (var i = 0; i < 14; i++) fx('spark', '', 285 + Math.random() * 30, 140 + Math.random() * 20, (Math.random() - 0.5) * 60);
  }
  function wakePuffle() {
    props.puffle.src = 'img/lounge/puffle-wach.svg';
    clearTimeout(wakePuffle.t);
    wakePuffle.t = setTimeout(function () { props.puffle.src = 'img/lounge/puffle.svg'; }, 4000);
  }

  // ---------- Sprechblasen (HTML, damit Emoji-Bilder gehen) ----------
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
      b.style.left = Math.max(2, Math.min(L.W - w - 2, p.x - w / 2)) + 'px';
      b.style.top = Math.max(2, p.y - 66 * L.scaleAt(p.y) - h - 4) + 'px';
    });
  }
  function byNick(n) { n = String(n).toLowerCase(); return list().filter(function (p) { return p.nick.toLowerCase() === n; })[0]; }

  return {
    init: init, say: say, byNick: byNick,
    nick: function () { return players[myId] ? players[myId].nick : ''; },
    players: function () { return players; },
    me: function () { return players[myId]; },
    myId: function () { return myId; }
  };
})();

// Spieluhr-Melodie fuers Grammophon (Web Audio, selbst komponiert, leise)
var Music = (function () {
  var ac, gain, on = false, timer, next = 0, step = 0;
  var BEAT = 0.34;
  // Walzer in C: [Melodie, Bass] je Schlag (0 = Pause)
  var MEL = [64, 67, 72, 71, 67, 64, 65, 69, 74, 72, 69, 65, 67, 71, 74, 72, 71, 69, 67, 64, 67, 72, 0, 0,
    64, 67, 72, 71, 67, 64, 65, 69, 74, 72, 69, 65, 67, 71, 74, 77, 74, 71, 72, 67, 64, 60, 0, 0];
  var BASS = [48, 0, 0, 43, 0, 0, 41, 0, 0, 45, 0, 0, 43, 0, 0, 43, 0, 0, 48, 0, 0, 48, 0, 0,
    48, 0, 0, 43, 0, 0, 41, 0, 0, 45, 0, 0, 43, 0, 0, 43, 0, 0, 48, 0, 0, 48, 0, 0];
  var hz = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };

  function note(n, t, type, vol, len) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = hz(n);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g); g.connect(gain);
    o.start(t); o.stop(t + len + 0.05);
  }
  function tick() {
    var muted = document.getElementById('mute') && document.getElementById('mute').checked;
    gain.gain.value = muted ? 0 : 1;
    while (next < ac.currentTime + 0.4) {
      var i = step % MEL.length;
      if (MEL[i]) { note(MEL[i], next, 'triangle', 0.09, BEAT * 1.6); note(MEL[i] + 12, next, 'sine', 0.025, BEAT); }
      if (BASS[i]) note(BASS[i], next, 'square', 0.025, BEAT * 2.2);
      next += BEAT; step++;
    }
  }
  function start() {
    if (!ac || timer) return;
    if (ac.state === 'suspended') ac.resume();
    next = ac.currentTime + 0.1; step = 0;
    timer = setInterval(tick, 120);
  }
  function stop() { clearInterval(timer); timer = null; }
  return {
    unlock: function () {
      if (ac) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC(); gain = ac.createGain(); gain.connect(ac.destination);
      if (on) start();
    },
    set: function (v) { on = v; if (on) start(); else stop(); }
  };
})();
