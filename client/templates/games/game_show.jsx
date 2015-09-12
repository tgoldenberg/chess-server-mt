var GameShow = ReactMeteor.createClass({
  templateName: "gameShow",
  getMeteorState: function() {
    return {
      position: _.last(Games.findOne(this.props._id).fen),
      moves: _.last(Games.findOne(this.props._id).moves),
      status: Games.findOne(this.props._id).status,
      history: Games.findOne(this.props._id).history,
      history: Games.findOne(this.props._id).history
    };
  },
  getInitialState: function() {
    return {
      board: null,
      game: this.props,
      chess: new Chess(),
      messages: []
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
      return game.white ? game.white.username : "N/A";
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
      this.state.board.position(this.state.position);
      var moveAttributes = this.getMoveData();
      var move = this.state.chess.move(moveAttributes);
      if (move)
        this.updateStatus(moveAttributes.from, moveAttributes.to);
    }
  },
  updateStatus: function(source, target) {
    var chess = this.state.chess;
    var status;
    var moveColor = chess.turn() === 'b' ? 'Black' : 'White';
    if (chess.in_checkmate() === true)
      status = `Game over, ${moveColor} is in checkmate`;
    else if (chess.in_draw() === true)
      status = 'Game over, drawn position';
    else
      status = `${moveColor} to move`;
    if (chess.in_check() === true)
      status += `, ${moveColor} is in check`;
    return status;
  },
  onDragStart: function(source, piece, position, orientation) {
    var chess = this.state.chess;
    if (chess.game_over() === true ||
      (chess.turn() === 'w' && this.userColor() === 'black' ) ||
      (chess.turn() === 'b' && this.userColor() === 'white' ) ||
      (chess.turn() === 'w' && piece.search(/^b/) != -1) ||
      (chess.turn() === 'b' && piece.search(/^w/) != -1)) {
        return false;
    }
  },
  onDrop: function(source, target) {
    var chess = this.state.chess;
    var move = chess.move({
      from: source,
      to: target,
      promotion: 'q'
    });
    if (move === null) return 'snapback';

    var data = {
      gameId: this.state.game._id,
      move: {source: source, target: target},
      fen: chess.fen(),
      status: this.updateStatus(source, target),
      history: this.state.chess.history(),
      pgn: this.state.chess.pgn()
    };
    Meteor.call('gameUpdateFen', data, function(error, result) {
      if (error)
        console.log(error.reason);
    });
  },
  componentWillUnmount: function() {
    Streamy.leave(this.props._id);
    Meteor.call('clearRooms');
    
  },
  componentDidMount: function() {
    this.state.chess.load_pgn(Games.findOne(this.props._id).pgn);
    console.log(this.state.chess);
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

  render: function() {
    var formattedHistory = this.formatHistory();
    var messages = this.state.messages.map(function(msg) {
      return (
        <div className="message">
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
                  <div className="timer-content">5:00</div>
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
                  <div className="timer-content">5:00</div>
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
            <p className="game-status"><span className="glyphicon glyphicon-check"></span><span>Status</span></p>
            <p className="game-status-content">{this.state.status}</p>
            <p className="game-history"><span className="glyphicon glyphicon-th-list"></span><span>History</span></p>
            <div className="game-history-content">{formattedHistory}</div>
            <p className="user-messages"><span className="glyphicon glyphicon-envelope"></span><span>Messages</span></p>
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
