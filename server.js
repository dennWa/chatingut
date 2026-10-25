const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));
app.use('/sounds', express.static(__dirname + '/Sounds'));

let visits = 1337; // Retro-Besucherzaehler
app.get('/api/stats', (req, res) => {
  res.json({ online: io.engine.clientsCount, visits: ++visits });
});

const COLORS = ['blau', 'rot', 'gruen', 'gelb', 'pink', 'lila', 'schwarz', 'orange'];
const W = 600, H = 400, FLOOR_Y = 170; // begehbarer Bereich: y >= FLOOR_Y
const players = {}; // id -> { id, nick, color, x, y }

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

io.on('connection', (socket) => {
  socket.on('join', (data) => {
    if (players[socket.id]) return;
    let nick = String(data && data.nick || '').replace(/[^\w\-äöüÄÖÜß]/g, '').slice(0, 14);
    if (nick.length < 2) nick = 'Gast' + Math.floor(Math.random() * 1000);
    while (Object.values(players).some(p => p.nick.toLowerCase() === nick.toLowerCase())) nick += '_';
    const color = COLORS.includes(data && data.color) ? data.color : 'blau';
    const p = { id: socket.id, nick, color, x: 200 + Math.random() * 200, y: 280 + Math.random() * 60 };
    players[socket.id] = p;
    socket.emit('welcome', { me: p, players: Object.values(players) });
    socket.broadcast.emit('playerJoined', p);
  });

  socket.on('move', (pos) => {
    const p = players[socket.id];
    if (!p || !pos) return;
    p.x = clamp(Number(pos.x) || 0, 20, W - 20);
    p.y = clamp(Number(pos.y) || 0, FLOOR_Y, H - 15);
    io.emit('playerMoved', { id: p.id, x: p.x, y: p.y });
  });

  socket.on('disconnect', () => {
    if (!players[socket.id]) return;
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

server.listen(PORT, () => console.log('PinguChat laeuft auf http://localhost:' + PORT));
