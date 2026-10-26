// Schnelltest: 2 User + Bots. Start: Server laufen lassen, dann `npm test`
const { io } = require('socket.io-client');
const URL = process.env.URL || 'http://localhost:3000';
const wait = (ms) => new Promise(r => setTimeout(r, ms));
let failed = 0;
const ok = (cond, name) => { console.log((cond ? 'OK   ' : 'FAIL ') + name); if (!cond) failed++; };

function client(nick, color) {
  const s = io(URL, { transports: ['websocket'], forceNew: true });
  s.got = [];
  s.onAny((ev, d) => s.got.push([ev, d]));
  s.on('connect', () => s.emit('join', { nick, color }));
  s.has = (ev, fn) => s.got.some(([e, d]) => e === ev && (!fn || fn(d)));
  s.last = (ev) => (s.got.filter(([e]) => e === ev).pop() || [])[1];
  return s;
}

(async () => {
  const a = client('Anna', 'rot'), b = client('Bernd', 'gruen');
  await wait(800);
  const wa = a.last('welcome');
  ok(wa && wa.players.some(p => p.nick === 'Pingo') && wa.players.some(p => p.nick === 'Tuxi'), 'Bots sind im Raum');
  ok(a.has('playerJoined', p => p.nick === 'Bernd'), 'Anna sieht Bernd kommen');

  a.emit('move', { x: 300, y: 380 });
  await wait(300);
  ok(b.has('playerMoved', m => m.id === a.id && m.x === 300 && m.y === 380), 'Bewegung wird synchronisiert');
  a.emit('move', { x: 300, y: 294 });
  await wait(300);
  ok(b.has('playerMoved', m => m.id === a.id && !(m.x === 300 && m.y === 294)), 'Klick auf Möbel -> nächster freier Bodenpunkt');

  // Lounge: Kakao holen, Licht, Hinsetzen, Knuddeln, Emotes
  a.emit('move', { x: 148, y: 350 }); await wait(200);
  a.emit('use', 'kakao'); await wait(300);
  ok(b.has('playerState', s => s.id === a.id && s.item === 'kakao'), 'Kakao holen');
  await wait(1500);
  a.emit('use', 'licht'); await wait(300);
  ok(!b.has('act', x => x.type === 'licht'), 'Lichtschalter aus der Ferne geht nicht');
  const seats = { sack2: [258, 372], hocker2: [544, 366], sessel: [410, 288], sack1: [538, 344] };
  let seatId = null;
  for (const [id, [x, y]] of Object.entries(seats)) {
    a.got.length = 0;
    a.emit('move', { x, y }); await wait(1600);
    a.emit('sit', id); await wait(300);
    if (a.has('playerMoved', m => m.id === a.id && m.seat === id)) { seatId = id; break; }
  }
  ok(seatId, 'Hinsetzen (' + seatId + ')');
  b.emit('move', { x: 300, y: 380 }); await wait(200);
  b.emit('sit', seatId); await wait(300);
  ok(!a.has('playerMoved', m => m.id === b.id && m.seat), 'Sitzen ohne davor zu stehen geht nicht');
  b.emit('knuddel', 'Anna'); await wait(300);
  ok(a.has('act', x => x.type === 'knuddel' && x.to === a.id), 'Knuddeln');
  await wait(900);
  b.emit('emote', 'winken'); await wait(300);
  ok(a.has('playerState', s => s.id === b.id && s.emote === 'winken'), 'Winken');
  a.emit('move', { x: 300, y: 380 }); await wait(300);

  a.emit('say', 'Hallo Pingo :)');
  await wait(2800);
  ok(b.has('said', m => m.nick === 'Anna' && m.text === 'Hallo Pingo :)'), 'Allchat kommt an');
  ok(a.has('said', m => m.nick === 'Pingo' && /Anna/.test(m.text)), 'Pingo antwortet im Allchat');

  a.emit('pm', { to: 'Bernd', text: 'Psst!' });
  await wait(300);
  ok(b.has('pm', m => m.from === 'Anna' && m.text === 'Psst!'), 'Privatnachricht kommt an');
  ok(a.has('pmSent', m => m.to === 'Bernd'), 'Absender bekommt Bestätigung');
  a.emit('pm', { to: 'Niemand', text: 'x' });
  await wait(700);
  ok(a.has('sys', t => /nicht online/.test(t)), 'PM an Unbekannt -> Fehlermeldung');

  b.emit('pm', { to: 'Tuxi', text: 'wie geht es dir?' });
  await wait(2800);
  ok(b.has('pm', m => m.from === 'Tuxi'), 'Tuxi antwortet privat');

  // TicTacToe Mensch gegen Mensch: Anna (X) gewinnt obere Reihe
  a.emit('tttInvite', b.id);
  await wait(300);
  const inv = b.last('tttInvited');
  ok(inv && inv.nick === 'Anna', 'TTT-Einladung kommt an');
  b.emit('tttAnswer', { from: a.id, accept: true });
  await wait(300);
  ok(a.has('tttStart', d => d.you === 'X') && b.has('tttStart', d => d.you === 'O'), 'TTT startet');
  for (const [s, c] of [[a, 0], [b, 3], [a, 1], [b, 4], [a, 2]]) { s.emit('tttMove', c); await wait(150); }
  const st = b.last('tttState');
  ok(st && st.winner === 'X' && st.line.join() === '0,1,2', 'Gewinner wird erkannt');

  // TicTacToe gegen Tuxi
  const tuxi = wa.players.find(p => p.nick === 'Tuxi');
  b.emit('tttInvite', tuxi.id);
  await wait(2000);
  ok(b.has('tttStart', d => d.opponent === 'Tuxi'), 'Tuxi nimmt TTT an');
  let guard = 0, s;
  while (guard++ < 20) {
    s = b.last('tttState');
    if (!s || s.winner) break;
    if (s.turn === s.you) b.emit('tttMove', s.board.findIndex(v => !v));
    await wait(1600);
  }
  s = b.last('tttState');
  ok(s && s.winner, 'Spiel gegen Tuxi endet (' + (s && s.winner) + ')');

  // Pingo lehnt ab
  const pingo = wa.players.find(p => p.nick === 'Pingo');
  a.emit('tttInvite', pingo.id);
  await wait(2000);
  ok(a.has('sys', t => /abgelehnt/.test(t)), 'Pingo lehnt TTT ab');

  const bId = b.id;
  b.disconnect();
  await wait(300);
  ok(a.has('playerLeft', id => id === bId), 'Verlassen wird gemeldet');
  a.disconnect();
  console.log(failed ? failed + ' Test(s) fehlgeschlagen' : 'Alle Tests OK');
  process.exit(failed ? 1 : 0);
})();
