const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const createTicTacToe = require('./games/tictactoe');
const bots = require('./bots');

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
const W = 600, H = 400, FLOOR_Y = 170; // begehbarer Bereich: y >= FLOOR_Y
const MAX_MSG = 120;
const players = {}; // id -> { id, nick, color, x, y, bot? }
const lastMsg = {}; // id -> Zeitstempel (Spam-Schutz)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cleanText = (t) => String(t || '').replace(/[\x00-\x1f]/g, ' ').trim().slice(0, MAX_MSG);
const byNick = (n) => Object.values(players).find(p => p.nick.toLowerCase() === String(n || '').toLowerCase());

// Nachricht an einen Spieler: echte User per Socket, Bots per Funktionsaufruf
function send(id, ev, data) {
  if (bots.isBot(id)) bots.receive(id, ev, data);
  else io.to(id).emit(ev, data);
}

function spamCheck(id) {
  const now = Date.now();
  if (lastMsg[id] && now - lastMsg[id] < 600) return false;
  lastMsg[id] = now;
  return true;
}

// Alle Aktionen laufen hierueber - von Sockets und von Bots
const actions = {
  join(id, nick, color, bot) {
    nick = String(nick || '').replace(/[^\w\-äöüÄÖÜß]/g, '').slice(0, 14);
    if (nick.length < 2) nick = 'Gast' + Math.floor(Math.random() * 1000);
    while (byNick(nick)) nick += '_';
    color = COLORS.includes(color) ? color : 'blau';
    const p = { id, nick, color, x: 150 + Math.random() * 300, y: 260 + Math.random() * 90, bot: !!bot };
    players[id] = p;
    return p;
  },
  leave(id) {
    if (!players[id]) return;
    ttt.quit(id);
    delete players[id];
    delete lastMsg[id];
    io.emit('playerLeft', id);
    bots.event('left', id);
  },
  move(id, x, y) {
    const p = players[id];
    if (!p) return;
    p.x = clamp(Number(x) || 0, 20, W - 20);
    p.y = clamp(Number(y) || 0, FLOOR_Y, H - 15);
    io.emit('playerMoved', { id, x: p.x, y: p.y });
  },
  say(id, text) {
    const p = players[id];
    text = cleanText(text);
    if (!p || !text || (!p.bot && !spamCheck(id))) return;
    io.emit('said', { id, nick: p.nick, text });
    bots.event('said', { id, nick: p.nick, text });
  },
  pm(id, toNick, text) {
    const p = players[id], to = byNick(toNick);
    text = cleanText(text);
    if (!p || !text) return;
    if (!to) return send(id, 'sys', 'User "' + toNick + '" ist nicht online.');
    if (to.id === id) return send(id, 'sys', 'Selbstgespräche? ;-)');
    if (!p.bot && !spamCheck(id)) return;
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
    socket.emit('welcome', { me: p, players: Object.values(players) });
    socket.broadcast.emit('playerJoined', p);
    bots.event('joined', p);
  });
  socket.on('move', (pos) => pos && actions.move(socket.id, pos.x, pos.y));
  socket.on('say', (text) => actions.say(socket.id, text));
  socket.on('pm', (d) => d && actions.pm(socket.id, d.to, d.text));
  socket.on('tttInvite', (toId) => ttt.invite(socket.id, toId));
  socket.on('tttAnswer', (d) => d && ttt.answer(socket.id, d.from, !!d.accept));
  socket.on('tttMove', (cell) => ttt.move(socket.id, cell));
  socket.on('tttQuit', () => ttt.quit(socket.id));
  socket.on('disconnect', () => actions.leave(socket.id));
});

bots.start({ actions, players, io, W, H, FLOOR_Y });

server.listen(PORT, () => console.log('PinguChat laeuft auf http://localhost:' + PORT));
