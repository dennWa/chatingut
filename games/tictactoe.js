// TicTacToe (serverseitig): Einladungen, Zuege, Gewinner
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function winnerOf(board) {
  for (const l of LINES) {
    const [a, b, c] = l;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line: l };
  }
  if (board.every(Boolean)) return { winner: 'draw', line: null };
  return null;
}

module.exports = function createTicTacToe({ send, players }) {
  const games = {};    // gameId -> { X, O, board, turn, over }
  const inGame = {};   // playerId -> gameId
  const invites = {};  // eingeladeneId -> Set(einladendeIds)
  let nextId = 1;

  const nick = (id) => (players[id] ? players[id].nick : '?');

  function state(g, extra) {
    const s = Object.assign({ board: g.board, turn: g.turn, winner: null, line: null }, extra || {});
    send(g.X, 'tttState', Object.assign({ you: 'X' }, s));
    send(g.O, 'tttState', Object.assign({ you: 'O' }, s));
  }

  function end(g) {
    g.over = true;
    delete inGame[g.X]; delete inGame[g.O];
    delete games[g.id];
  }

  return {
    winnerOf,
    invite(from, to) {
      if (!players[from] || !players[to] || from === to) return;
      if (inGame[from]) return send(from, 'sys', 'Du spielst schon eine Runde!');
      if (inGame[to]) return send(from, 'sys', nick(to) + ' spielt gerade schon.');
      (invites[to] = invites[to] || new Set()).add(from);
      send(to, 'tttInvited', { from, nick: nick(from) });
      send(from, 'sys', 'TicTacToe-Einladung an ' + nick(to) + ' geschickt...');
    },
    answer(me, from, accept) {
      if (!invites[me] || !invites[me].has(from)) return;
      invites[me].delete(from);
      if (!players[from]) return;
      if (!accept) return send(from, 'sys', nick(me) + ' hat die TicTacToe-Einladung abgelehnt.');
      if (inGame[me] || inGame[from]) return send(me, 'sys', 'Einer von euch spielt schon.');
      const g = { id: nextId++, X: from, O: me, board: Array(9).fill(null), turn: 'X', over: false };
      games[g.id] = g; inGame[from] = g.id; inGame[me] = g.id;
      send(from, 'tttStart', { you: 'X', opponent: nick(me) });
      send(me, 'tttStart', { you: 'O', opponent: nick(from) });
      state(g);
    },
    move(me, cell) {
      const g = games[inGame[me]];
      cell = Number(cell);
      if (!g || g.over || !(cell >= 0 && cell < 9) || g.board[cell]) return;
      const mark = g.X === me ? 'X' : 'O';
      if (g.turn !== mark) return;
      g.board[cell] = mark;
      g.turn = mark === 'X' ? 'O' : 'X';
      const w = winnerOf(g.board);
      if (w) { state(g, w); end(g); } else state(g);
    },
    quit(me) {
      if (invites[me]) delete invites[me];
      const g = games[inGame[me]];
      if (!g) return;
      const other = g.X === me ? g.O : g.X;
      send(other, 'tttState', { you: g.X === other ? 'X' : 'O', board: g.board, turn: null, winner: g.X === other ? 'X' : 'O', line: null, quit: nick(me) });
      end(g);
    },
  };
};
module.exports.winnerOf = winnerOf;
