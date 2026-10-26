// TicTacToe (Client): Einladungen, Spielfenster
var TTT = (function () {
  var socket, win, you, opponent;

  function init(sock) {
    socket = sock;
    socket.on('tttInvited', function (d) {
      Snd.play('ringin');
      var w = Win.create('Einladung', { width: 240 });
      w.body.innerHTML = '<p><b></b> lädt dich zu einer Runde <b>TicTacToe</b> ein!</p><button data-a="1">Annehmen</button> <button data-a="0">Ablehnen</button>';
      w.body.querySelector('p b').textContent = d.nick;
      var answered = false;
      w.body.onclick = function (e) {
        var a = e.target.getAttribute('data-a');
        if (a === null) return;
        answered = true;
        socket.emit('tttAnswer', { from: d.from, accept: a === '1' });
        w.close();
      };
      w.onclose = function () { if (!answered) socket.emit('tttAnswer', { from: d.from, accept: false }); };
    });
    socket.on('tttStart', function (d) {
      you = d.you; opponent = d.opponent;
      if (win) { win.onclose = null; win.close(); }
      win = Win.create('TicTacToe vs. ' + opponent, { width: 200 });
      var cells = '';
      for (var i = 0; i < 9; i++) cells += '<button class="cell" data-c="' + i + '"></button>';
      win.body.innerHTML = '<div class="tttstatus"></div><div class="tttgrid">' + cells + '</div><button class="quit">Aufgeben</button>';
      win.body.querySelector('.tttgrid').onclick = function (e) {
        var c = e.target.getAttribute('data-c');
        if (c !== null) socket.emit('tttMove', Number(c));
      };
      win.body.querySelector('.quit').onclick = function () { win.close(); };
      win.onclose = function () { socket.emit('tttQuit'); win = null; };
      Snd.play('Windows XP Restore', 0.5);
    });
    socket.on('tttState', render);
  }

  function render(s) {
    if (!win) return;
    var btns = win.body.querySelectorAll('.cell');
    s.board.forEach(function (v, i) {
      btns[i].textContent = v || '';
      btns[i].className = 'cell' + (v ? ' ' + v : '') + (s.line && s.line.indexOf(i) >= 0 ? ' win' : '');
      btns[i].disabled = !!v || !!s.winner || s.turn !== you;
    });
    var st = win.body.querySelector('.tttstatus'), q = win.body.querySelector('.quit');
    if (s.winner) {
      var txt;
      if (s.quit) txt = s.quit + ' hat aufgegeben. Du gewinnst!';
      else if (s.winner === 'draw') txt = 'Unentschieden!';
      else if (s.winner === you) txt = 'Du hast gewonnen! :)';
      else txt = opponent + ' hat gewonnen.';
      st.textContent = txt;
      Snd.play(s.winner === 'draw' ? 'chord' : s.winner === you ? 'tada' : 'Windows XP Critical Stop');
      q.textContent = 'Schließen';
      win.onclose = function () { win = null; };
    } else {
      st.textContent = 'Du bist ' + you + ' - ' + (s.turn === you ? 'Du bist dran!' : opponent + ' ist dran...');
    }
  }

  function invite(p) {
    if (win) return Chat.sys('Du spielst schon eine Runde!');
    socket.emit('tttInvite', p.id);
  }

  return { init: init, invite: invite };
})();
