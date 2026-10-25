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

io.on('connection', (socket) => {
  // Ab Phase 2: Raum, Chat, Bots
});

server.listen(PORT, () => console.log('PinguChat laeuft auf http://localhost:' + PORT));
