// Offline-Modus (z.B. GitHub Pages ohne Node-Server): spielt den Server im Browser nach,
// damit man die Lounge allein ausprobieren kann. Chat/Privat/TicTacToe gehen nur mit Server.
function OfflineSocket() {
  var handlers = {}, room = { radio: false, dim: false }, players = {}, me = 'me';
  var emit = function (ev, d) { setTimeout(function () { (handlers[ev] || []).forEach(function (f) { f(d); }); }, 30); };
  var add = function (id, nick, color, x, y, seat) {
    var s = seat && Lounge.SEATS[seat];
    players[id] = { id: id, nick: nick, color: color, bot: id !== me, x: s ? s.x : x, y: s ? s.y : y, seat: seat || null, item: null, emote: null };
  };
  var near = function (p, x, y) { return Math.hypot(p.x - x, p.y - y) <= 30; };
  var state = function (p) { emit('playerState', { id: p.id, item: p.item, emote: p.emote }); };
  var act = function (text, extra) { var a = extra || {}; a.text = text; emit('act', a); };

  var on = {
    join: function (d) {
      add('bot-pingo', 'Pingo', 'gelb', 0, 0, 'sofa2');
      add('bot-tuxi', 'Tuxi', 'schwarz', 0, 0, 'hocker1');
      add(me, d.nick || 'Gast', d.color || 'blau', 300, 380);
      var list = Object.keys(players).map(function (k) { return players[k]; });
      emit('welcome', { me: players[me], players: list, room: room });
      emit('sys', '*** Offline-Modus: Hier läuft kein Chat-Server. Du kannst die Lounge erkunden - chatten mit anderen geht nur auf dem richtigen Server. ***');
      setTimeout(function () { emit('said', { id: 'bot-tuxi', nick: 'Tuxi', text: 'Hallo ' + players[me].nick + '! Willkommen in der Lounge :)' }); }, 2000);
    },
    move: function (d) {
      var p = players[me], t = Lounge.nearestWalkable(+d.x || 0, +d.y || 0);
      p.x = t.x; p.y = t.y; p.seat = null;
      if (p.emote) { p.emote = null; state(p); }
      emit('playerMoved', { id: me, x: p.x, y: p.y, seat: null });
    },
    sit: function (id) {
      var p = players[me], s = Lounge.SEATS[id];
      if (!s || !near(p, s.ax, s.ay)) return;
      for (var k in players) if (players[k].seat === id) return emit('sys', 'Der Platz ist leider schon besetzt!');
      p.seat = id; p.x = s.x; p.y = s.y;
      emit('playerMoved', { id: me, x: p.x, y: p.y, seat: id });
    },
    use: function (id) {
      var p = players[me], o = Lounge.OBJ[id], n = p.nick;
      if (!o || !near(p, o.ax, o.ay)) return;
      if (id === 'kakao') { p.item = 'kakao'; state(p); act('> ' + n + ' holt sich einen heißen Kakao mit Marshmallows.', { type: 'kakao', from: me }); }
      else if (id === 'radio') { room.radio = !room.radio; emit('roomState', room); act(room.radio ? '> ' + n + ' legt eine Platte auf. Musik! ♪' : '> ' + n + ' hebt die Nadel vom Grammophon. Ruhe...', { type: 'radio' }); }
      else if (id === 'licht') { room.dim = !room.dim; emit('roomState', room); act(room.dim ? '> ' + n + ' dimmt das Licht. Jetzt wird\'s gemütlich...' : '> ' + n + ' knipst das Licht wieder an.', { type: 'licht' }); }
      else if (id === 'kamin') act('> ' + n + ' wärmt sich die Flossen am Kamin. Knister, knister...', { type: 'kamin' });
      else if (id === 'puffle') act('> ' + n + ' streichelt den Puffle. Er wacht auf und hüpft vor Freude!', { type: 'puffle' });
      else if (id === 'kekse') act('> ' + n + ' nascht einen Keks vom Teller. Mampf!', { type: 'kekse', from: me });
    },
    emote: function (t) {
      var p = players[me];
      if (t === 'tanzen' && p.seat) return emit('sys', 'Im Sitzen tanzen? Steh erst auf! ;)');
      p.emote = t; state(p);
      if (t === 'winken') setTimeout(function () { if (p.emote === 'winken') { p.emote = null; state(p); } }, 2600);
    },
    knuddel: function (to) {
      var q = players[to];
      for (var k in players) if (players[k].nick.toLowerCase() === String(to).toLowerCase()) q = players[k];
      if (!q) return emit('sys', 'User "' + to + '" ist nicht online.');
      if (q.id === me) return emit('sys', 'Sich selbst knuddeln? Na gut... *knuddel* ;)');
      act('> ' + players[me].nick + ' knuddelt ' + q.nick + ' ganz fest. *drück*', { type: 'knuddel', from: me, to: q.id });
      setTimeout(function () { emit('said', { id: q.id, nick: q.nick, text: 'Hihi, danke! <3' }); }, 1500);
    },
    say: function (t) { emit('said', { id: me, nick: players[me].nick, text: String(t).slice(0, 120) }); },
    pm: function () { emit('sys', 'Privatnachrichten gehen nur auf dem richtigen Server.'); },
    tttInvite: function () { emit('sys', 'TicTacToe geht nur auf dem richtigen Server.'); }
  };

  this.on = function (ev, f) { (handlers[ev] = handlers[ev] || []).push(f); if (ev === 'connect') setTimeout(f, 50); };
  this.emit = function (ev, d) { if (on[ev]) on[ev](d); };
  this.disconnect = function () {};
}
