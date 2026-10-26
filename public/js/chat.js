// Chat: Sounds, Allchat, Befehle, Privatfenster, Klick-Menue
var Snd = (function () {
  var muteBox;
  function play(file, vol) {
    if (!muteBox) muteBox = document.getElementById('mute');
    if (muteBox && muteBox.checked) return;
    var a = new Audio('/sounds/' + file + '.wav');
    a.volume = vol == null ? 0.6 : vol;
    a.play().catch(function () {});
  }
  return { play: play };
})();

// Fenster im Win98-Stil (verschiebbar)
var Win = (function () {
  var z = 100;
  function create(title, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'win';
    el.innerHTML = '<div class="titlebar"><span class="t"></span><button class="x" title="Schliessen">x</button></div><div class="winbody"></div>';
    el.querySelector('.t').textContent = title;
    el.style.left = (opts.x || 200 + Math.random() * 200) + 'px';
    el.style.top = (opts.y || 120 + Math.random() * 120) + 'px';
    if (opts.width) el.style.width = opts.width + 'px';
    document.body.appendChild(el);
    var w = { el: el, body: el.querySelector('.winbody'), onclose: null };
    w.close = function () { if (w.onclose) w.onclose(); if (el.parentNode) el.parentNode.removeChild(el); };
    w.focus = function () { el.style.zIndex = ++z; };
    el.querySelector('.x').onclick = w.close;
    el.onmousedown = w.focus;
    drag(el, el.querySelector('.titlebar'));
    w.focus();
    return w;
  }
  function drag(el, handle) {
    handle.onmousedown = function (e) {
      if (e.target.tagName === 'BUTTON') return;
      var ox = e.clientX - el.offsetLeft, oy = e.clientY - el.offsetTop;
      document.onmousemove = function (m) { el.style.left = (m.clientX - ox) + 'px'; el.style.top = Math.max(0, m.clientY - oy) + 'px'; };
      document.onmouseup = function () { document.onmousemove = document.onmouseup = null; };
      e.preventDefault();
    };
  }
  return { create: create };
})();

var Chat = (function () {
  var socket, logEl, input, nicks = {}, pms = {}, menu;

  function time() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  function log(html, cls) {
    var div = document.createElement('div');
    div.className = 'line ' + (cls || '');
    div.innerHTML = '<span class="time">[' + time() + ']</span> ' + html;
    var atBottom = logEl.scrollTop + logEl.clientHeight >= logEl.scrollHeight - 5;
    logEl.appendChild(div);
    while (logEl.children.length > 200) logEl.removeChild(logEl.firstChild);
    if (atBottom) logEl.scrollTop = logEl.scrollHeight;
  }
  function sys(text) { log(Emoji.esc(text), 'sys'); }

  function init(sock) {
    socket = sock;
    logEl = document.getElementById('chatlog');
    input = document.getElementById('msg');
    Emoji.bar(document.getElementById('emojis'), function (code) { input.value += (input.value && !/\s$/.test(input.value) ? ' ' : '') + code + ' '; input.focus(); });
    document.getElementById('send').onclick = submit;
    input.onkeydown = function (e) { if (e.key === 'Enter') submit(); };
    document.addEventListener('click', function (e) { if (menu && !menu.contains(e.target)) closeMenu(); });

    socket.on('welcome', function (d) {
      d.players.forEach(function (p) { nicks[p.id] = p.nick; });
      sys('*** Willkommen in der Lounge, ' + d.me.nick + '! Klick aufs Sofa, den Kamin, das Grammophon... Tippe /hilfe für Befehle. ***');
    });
    socket.on('playerJoined', function (p) { nicks[p.id] = p.nick; sys('*** ' + p.nick + ' betritt den Raum ***'); });
    socket.on('playerLeft', function (id) { if (nicks[id]) sys('*** ' + nicks[id] + ' hat den Raum verlassen ***'); delete nicks[id]; });
    socket.on('said', function (m) {
      var html = Emoji.parse(m.text);
      var mine = m.id === Room.myId();
      log('<b class="nick">' + Emoji.esc(m.nick) + ':</b> ' + html, mine ? 'mine' : '');
      Room.say(m.id, html);
      if (!mine) Snd.play('ding', 0.25);
    });
    socket.on('sys', sys);
    socket.on('act', function (a) {
      log('<span class="act">' + Emoji.esc(a.text) + '</span>');
      if (a.type === 'knuddel' && a.to === Room.myId()) Snd.play('Windows XP Balloon', 0.5);
    });
    socket.on('pm', function (m) {
      var w = pmWindow(m.from);
      pmLine(w, m.from, m.text, false);
      log('<b class="pm">[Privat von ' + Emoji.esc(m.from) + ']</b> ' + Emoji.parse(m.text), 'pmline');
      Snd.play('Windows XP Notify');
    });
    socket.on('pmSent', function (m) { pmLine(pmWindow(m.to), Room.nick(), m.text, true); });
    socket.on('disconnect', function () { sys('*** Verbindung verloren... versuche neu zu verbinden ***'); });
  }

  function submit() {
    var t = input.value.trim();
    input.value = '';
    if (!t) return;
    var m = t.match(/^\/(p|msg|w)\s+(\S+)\s+(.+)$/i);
    if (m) return socket.emit('pm', { to: m[2], text: m[3] });
    if (/^\/(hilfe|help)$/i.test(t)) {
      return sys('Befehle: /p Nick Text = Privat | /ttt Nick = TicTacToe | /knuddel Nick | /winken | /tanzen | Klick auf Pingu = Menü, Klick auf Möbel = hinsetzen/benutzen | Smileys: :) ;) :D xD :P :( :\'( :O 8) :@ :| ^^ <3');
    }
    var kn = t.match(/^\/(knuddel|knuddeln|k)\s+(\S+)$/i);
    if (kn) return socket.emit('knuddel', kn[2]);
    if (/^\/(winken|wink)$/i.test(t)) return socket.emit('emote', 'winken');
    if (/^\/(tanzen|tanz|dance)$/i.test(t)) return socket.emit('emote', 'tanzen');
    var tt = t.match(/^\/ttt\s+(\S+)$/i);
    if (tt) { var p = Room.byNick(tt[1]); return p ? TTT.invite(p) : sys('User "' + tt[1] + '" nicht gefunden.'); }
    if (t[0] === '/') return sys('Unbekannter Befehl. Tippe /hilfe');
    socket.emit('say', t);
  }

  // Privatfenster
  function pmWindow(nick) {
    var key = nick.toLowerCase();
    if (pms[key]) { pms[key].focus(); return pms[key]; }
    var w = Win.create('Privat: ' + nick, { width: 300 });
    w.body.innerHTML = '<div class="pmlog"></div><input type="text" maxlength="120" class="pminput"> <button>OK</button>';
    var inp = w.body.querySelector('input');
    var send = function () { var v = inp.value.trim(); inp.value = ''; if (v) socket.emit('pm', { to: nick, text: v }); };
    inp.onkeydown = function (e) { if (e.key === 'Enter') send(); };
    w.body.querySelector('button').onclick = send;
    w.onclose = function () { delete pms[key]; };
    pms[key] = w;
    setTimeout(function () { inp.focus(); }, 0);
    return w;
  }
  function pmLine(w, from, text, mine) {
    var l = w.body.querySelector('.pmlog');
    var d = document.createElement('div');
    d.innerHTML = '<span class="time">[' + time() + ']</span> <b class="' + (mine ? 'me' : 'other') + '">' + Emoji.esc(from) + ':</b> ' + Emoji.parse(text);
    l.appendChild(d); l.scrollTop = l.scrollHeight;
  }

  // Klick-Menue fuer einen Spieler
  function showMenu(p, x, y) {
    closeMenu();
    var self = p.id === Room.myId();
    menu = document.createElement('div');
    menu.className = 'menu';
    menu.innerHTML = '<div class="mt"></div>' + (self
      ? '<a href="#" data-a="winken">&raquo; Winken</a><a href="#" data-a="tanzen">&raquo; Tanzen</a>' + (p.seat ? '<a href="#" data-a="stand">&raquo; Aufstehen</a>' : '')
      : '<a href="#" data-a="pm">&raquo; Privat schreiben</a><a href="#" data-a="knuddel">&raquo; Knuddeln &hearts;</a><a href="#" data-a="ttt">&raquo; TicTacToe spielen</a>');
    menu.querySelector('.mt').textContent = self ? 'Das bist du!' : p.nick + (p.bot ? ' [Bot]' : '');
    menu.style.left = x + 'px'; menu.style.top = y + 'px';
    menu.onclick = function (e) {
      var a = e.target.getAttribute('data-a');
      if (!a) return;
      e.preventDefault(); closeMenu();
      if (a === 'pm') pmWindow(p.nick);
      if (a === 'ttt') TTT.invite(p);
      if (a === 'knuddel') socket.emit('knuddel', p.id);
      if (a === 'winken' || a === 'tanzen') socket.emit('emote', a);
      if (a === 'stand') { var s = Lounge.SEATS[p.seat]; socket.emit('move', { x: s.ax, y: s.ay }); }
    };
    document.body.appendChild(menu);
    Snd.play('Windows XP Menu Command', 0.4);
  }
  function closeMenu() { if (menu && menu.parentNode) menu.parentNode.removeChild(menu); menu = null; }

  return { init: init, log: log, sys: sys, showMenu: showMenu, pmWindow: pmWindow };
})();
