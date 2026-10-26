// Test-Bots: Pingo (laeuft rum, quatscht) und Tuxi (begruesst, spielt TicTacToe)
const { winnerOf } = require('./games/tictactoe');

const BOTS = {
  'bot-pingo': { nick: 'Pingo', color: 'gelb', walkEvery: [5000, 10000], ttt: false },
  'bot-tuxi': { nick: 'Tuxi', color: 'schwarz', walkEvery: [15000, 25000], ttt: true },
};

const PINGO_LINES = [
  'Wer erinnert sich noch an das ICQ "Oh-oh"? :D',
  'Damals mit 56k-Modem... und wir waren glücklich ^^',
  'Hat noch jemand ein Nokia 3310 in der Schublade? 8)',
  'Knuddels, Kwick, SchülerVZ... das waren Zeiten! <3',
  'Ich geh gleich ins Café, Kakao holen :)',
  'Brb, Mama braucht die Leitung zum Telefonieren! :P',
  'Wer hat früher auch stundenlang seinen MSN-Status gebastelt? xD',
  'Kennt ihr noch Winamp? It really whips! ;)',
];
const DEFAULT_REPLIES = ['Echt jetzt? :O', 'Haha, genau! :D', 'Hmm... ^^', 'Erzähl mehr! :)', 'Ich bin nur ein kleiner Pinguin ;)'];

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const later = (ms, fn) => setTimeout(fn, ms);

let ctx = null; // { actions, players, io, W, H, FLOOR_Y }

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

function scheduleWalk(id) {
  const b = BOTS[id];
  later(rnd(b.walkEvery[0], b.walkEvery[1]), () => {
    ctx.actions.move(id, rnd(40, ctx.W - 40), rnd(ctx.FLOOR_Y + 20, ctx.H - 30));
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
      later(2000, () => ctx.actions.say('bot-tuxi', 'Hallo ' + data.nick + '! Willkommen im PinguChat :)'));
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
