// Test-Bots: Pingo (laeuft rum, sitzt, holt Kakao, quatscht) und Tuxi (begruesst, sitzt am Spieltisch, spielt TicTacToe)
const { winnerOf } = require('./games/tictactoe');
const Lounge = require('./public/js/lounge');

const BOTS = {
  'bot-pingo': { nick: 'Pingo', color: 'gelb', walkEvery: [6000, 12000], ttt: false },
  'bot-tuxi': { nick: 'Tuxi', color: 'schwarz', walkEvery: [20000, 35000], ttt: true },
};

const PINGO_LINES = [
  'Wer erinnert sich noch an das ICQ "Oh-oh"? :D',
  'Damals mit 56k-Modem... und wir waren glücklich ^^',
  'Hat noch jemand ein Nokia 3310 in der Schublade? 8)',
  'Knuddels, Kwick, SchülerVZ... das waren Zeiten! <3',
  'Der Kakao an der Bude ist gratis! Holt euch einen :)',
  'Klickt mal aufs Grammophon, dann gibt\'s Musik! ^^',
  'Brb, Mama braucht die Leitung zum Telefonieren! :P',
  'Wer hat früher auch stundenlang seinen MSN-Status gebastelt? xD',
  'Kennt ihr noch Winamp? It really whips! ;)',
];
const DEFAULT_REPLIES = ['Echt jetzt? :O', 'Haha, genau! :D', 'Hmm... ^^', 'Erzähl mehr! :)', 'Ich bin nur ein kleiner Pinguin ;)'];

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const later = (ms, fn) => setTimeout(fn, ms);

let ctx = null; // { actions, players, io, room }

function reply(botId, nick, text) {
  const t = text.toLowerCase(), bot = BOTS[botId];
  if (/\b(hallo|hi|hey|moin|servus|huhu)\b/.test(t)) return 'Hey ' + nick + '! :D';
  if (/wie geht/.test(t)) return 'Mir geht\'s prima, danke! Und dir? :)';
  if (/tictactoe|tic tac toe|ttt|spiel/.test(t)) return bot.ttt ? 'Klick auf mich und lad mich zu TicTacToe ein! 8)' : 'Frag Tuxi, der ist der Profi ;)';
  if (/\bbot\b/.test(t)) return 'Bot? Ich? Niemals! ^^';
  return pick(DEFAULT_REPLIES);
}

// KI: gewinnen > blocken > Mitte > Ecke > zufaellig (mit etwas Zufall, damit man gewinnen kann)
function aiMove(board, me) {
  const other = me === 'X' ? 'O' : 'X';
  const free = board.map((v, i) => (v ? null : i)).filter(i => i !== null);
  const wins = (mark) => free.find(i => { const b = board.slice(); b[i] = mark; const w = winnerOf(b); return w && w.winner === mark; });
  if (Math.random() < 0.2) return pick(free);
  let c = wins(me); if (c !== undefined) return c;
  c = wins(other); if (c !== undefined) return c;
  if (!board[4]) return 4;
  const corners = [0, 2, 6, 8].filter(i => !board[i]);
  return corners.length ? pick(corners) : pick(free);
}

// Hinlaufen, nach geschaetzter Laufzeit etwas tun (Weg ist etwas laenger als Luftlinie)
function goTo(id, x, y, then) {
  const p = ctx.players[id];
  if (!p) return;
  const d = Math.hypot(p.x - x, p.y - y);
  ctx.actions.move(id, x, y);
  if (then) later(d / 130 * 1400 + 600, () => { const q = ctx.players[id]; if (q && q.x === x && q.y === y) then(); });
}
const freeSeats = (ids) => ids.filter(s => !Object.values(ctx.players).some(p => p.seat === s));
function sitOn(id, seats) {
  const free = freeSeats(seats);
  if (!free.length) return false;
  const seatId = pick(free), s = Lounge.SEATS[seatId];
  goTo(id, s.ax, s.ay, () => ctx.actions.sit(id, seatId));
  return true;
}
function useObj(id, objId) {
  const o = Lounge.OBJ[objId];
  goTo(id, o.ax, o.ay, () => ctx.actions.use(id, objId));
}
function wander(id) {
  const t = Lounge.nearestWalkable(rnd(40, 560), rnd(240, 390));
  goTo(id, t.x, t.y);
}

function behave(id) {
  const p = ctx.players[id], r = Math.random();
  if (!p) return;
  if (id === 'bot-tuxi') {
    // Tuxi wartet am liebsten am Spieltisch auf Herausforderer
    if (p.seat && p.seat.startsWith('hocker') && r < 0.75) return;
    if (r < 0.8 && sitOn(id, ['hocker1', 'hocker2'])) return;
    return r < 0.9 ? useObj(id, 'kamin') : wander(id);
  }
  if (ctx.room.radio && !p.seat && r < 0.5) return ctx.actions.emote(id, 'tanzen');
  if (r < 0.4) return wander(id);
  if (r < 0.65 && sitOn(id, ['sofa1', 'sofa2', 'sofa3', 'sessel', 'sack1', 'sack2'])) return;
  if (r < 0.8 && !p.item) return useObj(id, 'kakao');
  if (r < 0.9) return useObj(id, 'puffle');
  wander(id);
}

function scheduleWalk(id) {
  const b = BOTS[id];
  later(rnd(b.walkEvery[0], b.walkEvery[1]), () => {
    behave(id);
    scheduleWalk(id);
  });
}

function scheduleChatter() {
  later(rnd(45000, 90000), () => {
    const humans = Object.values(ctx.players).some(p => !p.bot);
    if (humans) ctx.actions.say('bot-pingo', pick(PINGO_LINES));
    scheduleChatter();
  });
}

module.exports = {
  isBot: (id) => !!BOTS[id],

  start(c) {
    ctx = c;
    for (const id of Object.keys(BOTS)) {
      const p = ctx.actions.join(id, BOTS[id].nick, BOTS[id].color, true);
      ctx.io.emit('playerJoined', p);
      scheduleWalk(id);
    }
    later(1500, () => sitOn('bot-tuxi', ['hocker1']));
    scheduleChatter();
  },

  // Direkte Nachrichten an einen Bot
  receive(botId, ev, data) {
    const bot = BOTS[botId];
    if (ev === 'pm') {
      later(rnd(1200, 2500), () => ctx.actions.pm(botId, data.from, reply(botId, data.from, data.text)));
    } else if (ev === 'tttInvited') {
      if (bot.ttt) later(1500, () => ctx.actions.ttt.answer(botId, data.from, true));
      else later(1500, () => {
        ctx.actions.ttt.answer(botId, data.from, false);
        ctx.actions.pm(botId, data.nick, 'Sorry, keine Zeit, ich watschel grad! Frag Tuxi :)');
      });
    } else if (ev === 'tttState') {
      if (data.winner) {
        const msg = data.quit ? 'Schade, schon weg? :(' : data.winner === 'draw' ? 'Unentschieden! Revanche? :)' : data.winner === data.you ? 'Gewonnen! GG ^^' : 'Du hast gewonnen, GG! :D';
        later(800, () => ctx.actions.say(botId, msg));
        return;
      }
      if (data.turn === data.you) later(rnd(700, 1400), () => ctx.actions.ttt.move(botId, aiMove(data.board, data.you)));
    }
  },

  // Ereignisse im Raum
  event(type, data) {
    if (!ctx) return;
    if (type === 'joined' && !data.bot) {
      later(2000, () => ctx.actions.say('bot-tuxi', 'Hallo ' + data.nick + '! Willkommen in der Lounge :)'));
      later(3500, () => ctx.actions.emote('bot-pingo', 'winken'));
    } else if (type === 'knuddel' && BOTS[data.to] && !BOTS[data.from]) {
      const from = ctx.players[data.from];
      if (!from) return;
      later(rnd(1200, 2200), () => {
        if (Math.random() < 0.5) ctx.actions.knuddel(data.to, data.from);
        else ctx.actions.say(data.to, pick(['Hihi, danke ' + from.nick + '! <3', 'Awww ^^ *rotwerd*', 'Knuddel zurück! :D']));
      });
    } else if (type === 'used' && data.obj === 'radio' && ctx.room.radio && !BOTS[data.id]) {
      later(rnd(1500, 3000), () => { const p = ctx.players['bot-pingo']; if (p && !p.seat) ctx.actions.emote('bot-pingo', 'tanzen'); });
    } else if (type === 'said' && !(ctx.players[data.id] || {}).bot) {
      const t = data.text.toLowerCase();
      for (const id of Object.keys(BOTS)) {
        if (t.includes(BOTS[id].nick.toLowerCase())) {
          later(rnd(1000, 2200), () => ctx.actions.say(id, reply(id, data.nick, data.text)));
        }
      }
    }
  },
};
