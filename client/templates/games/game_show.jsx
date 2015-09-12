var GameShow = ReactMeteor.createClass({
  templateName: "gameShow",
  getMeteorState: function() {
    return {
      moves: _.last(Games.findOne(this.props._id).moves),
      status: Games.findOne(this.props._id).status,
      history: Games.findOne(this.props._id).history,
      pgn: Games.findOne(this.props._id).pgn,
      gameOver: Games.findOne(this.props._id).gameOver
    };
  },
  getInitialState: function() {
    return {
      board: null,
      game: this.props,
      chess: new Chess(),
      messages: [],
      blackTimerSeconds: Games.findOne(this.props._id).blackTimer,
      whiteTimerSeconds: Games.findOne(this.props._id).whiteTimer
    }
  },
  findPlayerId: function(key) {
    return this.props[key] ? this.props[key].userId : null;
  },
  isPlayer: function() {
    return _.contains([this.findPlayerId("black"), this.findPlayerId("white")], this.getUserId());
  },
  getUserId: function() {
    return Meteor.userId() ? Meteor.userId() : Session.get('userId');
  },
  getUsername: function() {
    return Meteor.userId() ? Meteor.user().username : Session.get('currentUser');
  },
  getOpponentName: function() {
    var game = Games.findOne(this.props._id);
    if (this.isPlayer() && this.userColor() == "black") {
      return game.white ? game.white.name : "N/a";
    } else {
      return game.black ? game.black.name : "N/A";
    }
  },
  getBottomPlayerName: function() {
    if (this.isPlayer()) {
      return this.getUsername();
    } else {
      var game = Games.findOne(this.props._id);
      return game.white ? game.white.name : "N/A";
    }
  },
  checkGameColor: function(color) {
    return this.isPlayer() && this.state.game[color];
  },
  getUserColor: function(color, opposite) {
    return this.getUserId() == this.state.game[color].userId ? color : opposite;
  },
  userColor: function() {
    if (this.checkGameColor("black"))
      return this.getUserColor("black", "white");
    else if (this.checkGameColor("white"))
      return this.getUserColor("white", "black");
  },
  needsUpdate: function() {
    return  (this.state.chess.turn() == 'b' && this.userColor() == 'white') ||
            (this.state.chess.turn() == 'w' && this.userColor() == 'black');
  },
  adjustHistoryScroll: function() {
    var scroll = $('.game-history-content')[0].scrollHeight;
    $('.game-history-content').scrollTop(scroll);
  },
  getMoveData: function() {
    var source = this.state.moves ? this.state.moves.source : "";
    var target = this.state.moves ? this.state.moves.target : "";
    return {from: source, to: target, promotion: 'q'};
  },
  componentDidUpdate: function() {
    this.adjustHistoryScroll();
    if (this.needsUpdate()) {
      // modify board and insert move into the Chess() object
      var moveAttributes = this.getMoveData();
      var move = this.state.chess.move(moveAttributes);
      if (move) {
        this.updateStatus(moveAttributes.from, moveAttributes.to);
        // change timer
        this.state.board.position(this.state.chess.fen());
        var history = this.state.chess.history().length;
        var turn = this.state.chess.turn();
        if (this.isFirstMove()) {
          this.blackInterval = setInterval(this.blackTick, 1000);
        } else if (! this.isFirstMove() && this.state.chess.turn() === 'w') {
          clearInterval(this.blackInterval);
          this.whiteInterval = setInterval(this.whiteTick, 1000);
        } else if (! this.isFirstMove() && this.state.chess.turn() === 'b') {
          clearInterval(this.whiteInterval);
          this.blackInterval = setInterval(this.blackTick, 1000);
        }
      }
    }
  },
  clearIntervals: function() {
    clearInterval(this.blackInterval);
    clearInterval(this.whiteInterval);
  },
  updateStatus: function(source, target) {
    var chess = this.state.chess;
    var status;
    var moveColor = chess.turn() === 'b' ? 'Black' : 'White';
    if (chess.in_checkmate() === true) {
      status = `Game over, ${moveColor} is in checkmate`;
      this.clearIntervals();
    }
    else if (chess.in_draw() === true){
      status = 'Game over, drawn position';
      this.clearIntervals();
    }
    else
      status = `${moveColor} to move`;
    if (chess.in_check() === true && chess.in_checkmate() != true)
      status += `, ${moveColor} is in check`;
    return status;
  },
  onDragStart: function(source, piece, position, orientation) {
    var chess = this.state.chess;
    if (chess.game_over() === true ||
      (this.state.gameOver === true) ||
      (chess.turn() === 'w' && this.userColor() === 'black' ) ||
      (chess.turn() === 'b' && this.userColor() === 'white' ) ||
      (chess.turn() === 'w' && piece.search(/^b/) != -1) ||
      (chess.turn() === 'b' && piece.search(/^w/) != -1)) {
        return false;
    }
  },
  gameOver: function(color) {
    this.clearIntervals();
    var status = this.state.chess.game_over() ? this.updateStatus() : `Game over, ${color} wins on time`;
    data = {
      status: status,
      gameId: this.props._id,
      color: color
    };
    Meteor.call('gameOver', data, function(error, result) {
      if (error)
        console.log(error.reason);
    })
  },
  blackTick: function() {
    if (this.state.blackTimerSeconds == 0) {
      this.gameOver('white');
    } else {
      this.setState({ blackTimerSeconds: this.state.blackTimerSeconds-1 });
    }
  },
  whiteTick: function() {
    if (this.state.whiteTimerSeconds == 0) {
      this.gameOver('black');
    } else {
      this.setState({ whiteTimerSeconds: this.state.whiteTimerSeconds-1 });
    }
  },
  onSnapEnd: function() {
    this.state.board.position(this.state.chess.fen());
  },
  isFirstMove: function() {
    return this.state.chess.history().length === 1;
  },
  onDrop: function(source, target) {
    var chess = this.state.chess;
    var move = chess.move({
      from: source,
      to: target,
      promotion: 'q'
    });
    if (move === null) return 'snapback';

    // change clock;
    if (this.isFirstMove()) {
      this.blackInterval = setInterval(this.blackTick, 1000);
    } else if (! this.isFirstMove() && this.state.chess.turn() === 'w') {
      clearInterval(this.blackInterval);
      this.whiteInterval = setInterval(this.whiteTick, 1000);
    } else if (! this.isFirstMove() && this.state.chess.turn() === 'b') {
      clearInterval(this.whiteInterval);
      this.blackInterval = setInterval(this.blackTick, 1000);
    }
    var data = {
      gameId: this.state.game._id,
      move: {source: source, target: target},
      fen: chess.fen(),
      status: this.updateStatus(source, target),
      history: this.state.chess.history(),
      pgn: this.state.chess.pgn(),
      whiteTimer: this.state.whiteTimerSeconds,
      blackTimer: this.state.blackTimerSeconds
    };
    Meteor.call('gameUpdateFen', data, function(error, result) {
      if (error)
        console.log(error.reason);
    });
    if (this.state.chess.game_over()) {
      this.gameOver(this.userColor());
    }
  },
  componentWillUnmount: function() {
    Streamy.leave(this.props._id);
    Meteor.call('clearRooms');
  },
  componentDidMount: function() {
    this.state.chess.load_pgn(Games.findOne(this.props._id).pgn);
    if (this.isPlayer()) {
      Streamy.join(this.props._id);
    }
    Streamy.on('outgoing_chat', function(data) {
      var messages = this.state.messages;
      messages.push(data);
      this.setState({messages: messages});
      var scroll = $('.user-messages-content')[0].scrollHeight;
      $('.user-messages-content').scrollTop(scroll);
    }.bind(this));

    // this.renderPlayedGame();
    var cfg = {
      pieceTheme: '/{piece}.png',
      position: _.last(this.props.fen),
      draggable: this.isPlayer(),
      orientation: this.userColor(),
      onDrop: this.onDrop,
      onSnapEnd: this.onSnapEnd,
      snapSpeed: 100,
      snapbackSpeed: 400,
      moveSpeed: 'slow',
      onDragStart: this.onDragStart
    }
    this.setState({board: new ChessBoard('board', cfg)})
  },
  formatHistory: function() {
    var history = this.state.history;
    return history.map(function(notation, idx) {
      var number = Math.ceil(idx/2) + 1;
      if (idx % 2 === 0 && idx + 1 == history.length) { // even and last move
        return (
          <div className="history-line">
            <p className="last-move"><span className="numbers">{number}.</span> {notation}</p>
          </div>
        );
      } else if (idx % 2 === 0) { // previous moves
        var next = history[idx + 1];
        var lastMove = idx+2 == history.length ? "last-move" : "";
        return (
          <div className="history-line">
            <p><span className="numbers">{number}.</span> {notation}</p>
            <p className={lastMove}>{next}</p>
          </div>
        );
      }
    });
  },

  submitMessage: function(e) {
    e.preventDefault();
    var message = $(e.target).find('input').val();
    $(e.target).find('input').val('');
    Streamy.rooms(this.props._id).emit('outgoing_chat', { from: this.getUsername(), message: message, submitted: new Date() });
  },
  pad: function (num) {
    var str = num.toString();
    if (str.length < 2)
      str = "0" + str;
    return str;
  },
  formatTime: function(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return this.pad(m) + ":" + this.pad(s);
  },

  render: function() {
    var currentUserTimer = this.userColor() == 'white' ? this.state.whiteTimerSeconds : this.state.blackTimerSeconds;
    var opponentTimer = this.userColor() == 'white' ? this.state.blackTimerSeconds : this.state.whiteTimerSeconds;

    var formattedHistory = this.formatHistory();
    var messages = this.state.messages.map(function(msg, idx) {
      return (
        <div className="message" key={idx}>
          <p className="message-content">{msg.message}</p>
          <p className="message-from">{msg.from} <span>{new Date(msg.submitted).toLocaleString()}</span></p>
        </div>
      )
    });
    return (
      <div id="game-page-wrapper">
        <div className="game-wrapper">
          <div className="player-info">
            <div className="other-player">
              <div className="timer">
                <div className="timer-header">
                  <div className="timer-player">
                    <span className="glyphicon glyphicon-hourglass"></span>
                    <p>{this.getOpponentName()}</p>
                  </div>
                  <div className="minimize">
                    <span className="glyphicon glyphicon-minus"></span>
                  </div>
                </div>
                <div className="timer-holder">
                  <div className="timer-content" id="white">{this.formatTime(opponentTimer)}</div>
                </div>
              </div>
              <div className="profile">
                <div className="profile-header">
                  <span className="glyphicon glyphicon-user"></span>
                  <p>{this.getOpponentName()}</p>
                </div>
                <div className="profile-content">
                  <p>Rating: 1200</p>
                  <p>Games Played: 10</p>
                  <p>Country: United States</p>
                </div>
              </div>
            </div>
            <div className="current-player">
              <div className="timer">
                <div className="timer-header">
                  <div className="timer-player">
                    <span className="glyphicon glyphicon-hourglass"></span>
                    <p>{this.getBottomPlayerName()}</p>
                  </div>
                  <div className="minimize">
                    <span className="glyphicon glyphicon-minus"></span>
                  </div>
                </div>
                <div className="timer-holder">
                  <div className="timer-content" id="black">{this.formatTime(currentUserTimer)}</div>
                </div>
              </div>
              <div className="profile">
                <div className="profile-header">
                  <span className="glyphicon glyphicon-user"></span>
                  <p>{this.getBottomPlayerName()}</p>
                </div>
                <div className="profile-content">
                  <p>Rating: 1200</p>
                  <p>Games Played: 10</p>
                  <p>Country: United States</p>
                </div>
              </div>
            </div>
          </div>
            <div className="board-holder">
            <div id="board"></div>
            <div className="button-holder">
              <div className="button">
                <button>Draw</button>
              </div>
              <div className="button">
                <button>Resign</button>
              </div>
              <div className="button">
                <button>Undo Move</button>
              </div>
            </div>
          </div>
          <div className="game-messages">
            <p className="game-status">
              <span className="glyphicon glyphicon-check"></span>
              <span>Status</span>
            </p>
            <p className="game-status-content">{this.state.status}</p>
            <p className="game-history">
              <span className="glyphicon glyphicon-th-list"></span>
              <span>History</span>
            </p>
            <div className="game-history-content">{formattedHistory}</div>
            <p className="user-messages">
              <span className="glyphicon glyphicon-envelope"></span>
              <span>Messages</span>
            </p>
            <div className="messages-holder">
              <div className="user-messages-content">
                {messages}
              </div>
              <form id="text-message" onSubmit={this.submitMessage}>
                <input type="text" placeholder="Your message here"/>
              </form>
            </div>
          </div>
        </div>
        <div className="mobile-player-info">Hey</div>
        <div className="mobile-game-messages">Hi</div>
      </div>
    );
  }
});
