const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const createTicTacToe = require('./games/tictactoe');
const bots = require('./bots');
const Lounge = require('./public/js/lounge');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));
app.use('/sounds', express.static(__dirname + '/Sounds'));

let visits = 1337; // Retro-Besucherzaehler
app.get('/api/stats', (req, res) => {
  res.json({ online: Object.keys(players).length, visits: ++visits });
});

const COLORS = ['blau', 'rot', 'gruen', 'gelb', 'pink', 'lila', 'schwarz', 'orange'];
const MAX_MSG = 120;
const players = {}; // id -> { id, nick, color, x, y, bot, seat, item, emote }
const lastMsg = {}; // id -> Zeitstempel (Spam-Schutz Chat)
const lastAct = {}; // id -> Zeitstempel (Spam-Schutz Aktionen)
const timers = {};  // 'id:item' / 'id:emote' -> Timeout (nicht im Spielerobjekt, sonst kaputtes JSON)
const room = { radio: false, dim: false }; // gemeinsamer Zustand der Lounge

const cleanText = (t) => String(t || '').replace(/[\x00-\x1f]/g, ' ').trim().slice(0, MAX_MSG);
const byNick = (n) => Object.values(players).find(p => p.nick.toLowerCase() === String(n || '').toLowerCase());
const near = (p, x, y) => Math.hypot(p.x - x, p.y - y) <= 30;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Nachricht an einen Spieler: echte User per Socket, Bots per Funktionsaufruf
function send(id, ev, data) {
  if (bots.isBot(id)) bots.receive(id, ev, data);
  else io.to(id).emit(ev, data);
}

function spamCheck(id, store = lastMsg, ms = 600) {
  if (players[id] && players[id].bot) return true;
  const now = Date.now();
  if (store[id] && now - store[id] < ms) return false;
  store[id] = now;
  return true;
}

function later(key, ms, fn) {
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => { delete timers[key]; fn(); }, ms);
}
function pState(p) { io.emit('playerState', { id: p.id, item: p.item, emote: p.emote }); }
function act(text, extra) { io.emit('act', Object.assign({ text }, extra)); }

const KNUDDEL = [
  '%a knuddelt %b ganz fest. *drück*',
  '%b kann sich der Knuddelattacke von %a nicht entziehen und wird ordentlich durchgeknuddelt.',
  '%a schleicht sich an und knuddelt %b von hinten. Überraschung!',
  '%a wirft sich %b um den Hals und knuddelt los. Awww!',
  '%b bekommt von %a einen dicken Knuddler mit Flossenklaps.',
];

// Alle Aktionen laufen hierueber - von Sockets und von Bots
const actions = {
  join(id, nick, color, bot) {
    nick = String(nick || '').replace(/[^\w\-äöüÄÖÜß]/g, '').slice(0, 14);
    if (nick.length < 2) nick = 'Gast' + Math.floor(Math.random() * 1000);
    while (byNick(nick)) nick += '_';
    color = COLORS.includes(color) ? color : 'blau';
    const sp = Lounge.nearestWalkable(300 + (Math.random() - 0.5) * 200, 372 + Math.random() * 20);
    const p = { id, nick, color, x: sp.x, y: sp.y, bot: !!bot, seat: null, item: null, emote: null };
    players[id] = p;
    return p;
  },
  leave(id) {
    if (!players[id]) return;
    ttt.quit(id);
    delete players[id];
    delete lastMsg[id];
    delete lastAct[id];
    for (const k of Object.keys(timers)) if (k.startsWith(id + ':')) { clearTimeout(timers[k]); delete timers[k]; }
    io.emit('playerLeft', id);
    bots.event('left', id);
  },
  move(id, x, y) {
    const p = players[id];
    if (!p) return;
    const t = Lounge.nearestWalkable(Number(x) || 0, Number(y) || 0);
    p.x = t.x; p.y = t.y; p.seat = null;
    if (p.emote) { p.emote = null; pState(p); }
    io.emit('playerMoved', { id, x: p.x, y: p.y, seat: null });
  },
  // Hinsetzen: der Pingu muss vor dem Platz stehen (Client laeuft vorher hin)
  sit(id, seatId) {
    const p = players[id], s = Lounge.SEATS[seatId];
    if (!p || !s || p.seat === seatId || !near(p, s.ax, s.ay)) return;
    if (Object.values(players).some(o => o.seat === seatId)) return send(id, 'sys', 'Der Platz ist leider schon besetzt!');
    p.seat = seatId; p.x = s.x; p.y = s.y;
    if (p.emote) { p.emote = null; pState(p); }
    io.emit('playerMoved', { id, x: p.x, y: p.y, seat: seatId });
  },
  // Gegenstaende in der Lounge benutzen
  use(id, objId) {
    const p = players[id], o = Lounge.OBJ[objId];
    if (!p || !o || !o.use || !near(p, o.ax, o.ay) || !spamCheck(id, lastAct, 1500)) return;
    const n = p.nick;
    if (objId === 'kakao') {
      p.item = 'kakao'; pState(p);
      act('> ' + n + ' holt sich einen heißen Kakao mit Marshmallows.', { type: 'kakao', from: id });
      later(id + ':item', 90000, () => { if (players[id]) { p.item = null; pState(p); } });
    } else if (objId === 'radio') {
      room.radio = !room.radio;
      io.emit('roomState', room);
      act(room.radio ? '> ' + n + ' legt eine Platte auf. Musik! ♪' : '> ' + n + ' hebt die Nadel vom Grammophon. Ruhe...', { type: 'radio', from: id });
    } else if (objId === 'licht') {
      room.dim = !room.dim;
      io.emit('roomState', room);
      act(room.dim ? '> ' + n + ' dimmt das Licht. Jetzt wird\'s gemütlich...' : '> ' + n + ' knipst das Licht wieder an.', { type: 'licht', from: id });
    } else if (objId === 'kamin') {
      act('> ' + n + ' wärmt sich die Flossen am Kamin. Knister, knister...', { type: 'kamin', from: id });
    } else if (objId === 'puffle') {
      act('> ' + n + ' streichelt den Puffle. Er wacht auf und hüpft vor Freude!', { type: 'puffle', from: id });
    } else if (objId === 'kekse') {
      act('> ' + n + ' ' + pick(['nascht einen Keks vom Teller. Mampf!', 'stibitzt heimlich zwei Kekse.', 'krümelt beim Keksessen alles voll.']), { type: 'kekse', from: id });
    }
    bots.event('used', { id, obj: objId });
  },
  emote(id, type) {
    const p = players[id];
    if (!p || !['winken', 'tanzen'].includes(type) || !spamCheck(id, lastAct, 800)) return;
    if (type === 'tanzen' && p.seat) return send(id, 'sys', 'Im Sitzen tanzen? Steh erst auf! ;)');
    p.emote = type; pState(p);
    if (type === 'winken') later(id + ':emote', 2600, () => { if (players[id] && p.emote === 'winken') { p.emote = null; pState(p); } });
  },
  knuddel(id, to) {
    const p = players[id], q = players[to] || byNick(to);
    if (!p) return;
    if (!q) return send(id, 'sys', 'User "' + to + '" ist nicht online.');
    if (q.id === id) return send(id, 'sys', 'Sich selbst knuddeln? Na gut... *knuddel* ;)');
    if (!spamCheck(id, lastAct, 1500)) return;
    act('> ' + pick(KNUDDEL).replace('%a', p.nick).replace('%b', q.nick), { type: 'knuddel', from: id, to: q.id });
    bots.event('knuddel', { from: id, to: q.id });
  },
  say(id, text) {
    const p = players[id];
    text = cleanText(text);
    if (!p || !text || !spamCheck(id)) return;
    io.emit('said', { id, nick: p.nick, text });
    bots.event('said', { id, nick: p.nick, text });
  },
  pm(id, toNick, text) {
    const p = players[id], to = byNick(toNick);
    text = cleanText(text);
    if (!p || !text) return;
    if (!to) return send(id, 'sys', 'User "' + toNick + '" ist nicht online.');
    if (to.id === id) return send(id, 'sys', 'Selbstgespräche? ;-)');
    if (!spamCheck(id)) return;
    send(to.id, 'pm', { from: p.nick, text });
    send(id, 'pmSent', { to: to.nick, text });
  },
};

const ttt = createTicTacToe({ send, players });
actions.ttt = ttt;

io.on('connection', (socket) => {
  socket.on('join', (data) => {
    if (players[socket.id]) return;
    const p = actions.join(socket.id, data && data.nick, data && data.color);
    socket.emit('welcome', { me: p, players: Object.values(players), room });
    socket.broadcast.emit('playerJoined', p);
    bots.event('joined', p);
  });
  socket.on('move', (pos) => pos && actions.move(socket.id, pos.x, pos.y));
  socket.on('sit', (seat) => actions.sit(socket.id, seat));
  socket.on('use', (obj) => actions.use(socket.id, obj));
  socket.on('emote', (type) => actions.emote(socket.id, type));
  socket.on('knuddel', (to) => actions.knuddel(socket.id, to));
  socket.on('say', (text) => actions.say(socket.id, text));
  socket.on('pm', (d) => d && actions.pm(socket.id, d.to, d.text));
  socket.on('tttInvite', (toId) => ttt.invite(socket.id, toId));
  socket.on('tttAnswer', (d) => d && ttt.answer(socket.id, d.from, !!d.accept));
  socket.on('tttMove', (cell) => ttt.move(socket.id, cell));
  socket.on('tttQuit', () => ttt.quit(socket.id));
  socket.on('disconnect', () => actions.leave(socket.id));
});

bots.start({ actions, players, io, room });

server.listen(PORT, () => console.log('PinguChat laeuft auf http://localhost:' + PORT));
