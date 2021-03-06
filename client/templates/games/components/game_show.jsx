var GameShow = ReactMeteor.createClass({
  templateName: "gameShow",
  getMeteorState: function() {
    return {
      game: Games.findOne(this.props.game._id),
      moves: _.last(Games.findOne(this.props.game._id).moves)
    };
  },
  getInitialState: function() {
    return {
      board: null,
      chess: new Chess(),
      messages: [],
      blackTimerSeconds: Games.findOne(this.props.game._id).blackTimer,
      whiteTimerSeconds: Games.findOne(this.props.game._id).whiteTimer
    }
  },
  componentDidMount: function() {
    this.state.chess.load_pgn(Games.findOne(this.props.game._id).pgn); // load previous games notation
    this.joinRoom(); // set up Streamy for messaging
    this.listenForMessages(); // event observer for messages
    this.receiveDrawOffer(); // listen for draw offer
    this.receiveUndoRequest(); // listen for undo requests
    this.receiveUndoAcception(); // listen for undo accept
    this.receiveUndoDecline(); // listen to decline of undo requests
    this.receiveDrawDecline(); // listen to decline of draw requests
    this.receiveDrawAcception(); // listen to other user's draw acception
    this.receiveResignation(); // listen to other user's resignation
    var data = {chess: this.state.chess};
    var config = new CFG(data, this.onDropCallback).render();
    _.extend(config, {
      position    : _.last(this.state.game.fen),
      draggable   : this.props.isPlayer(),
      orientation : this.props.userColor(),
      onDragStart : this.onDragStart,
      onSnapEnd   : this.onSnapEnd
    });
    if (! this.state.game.gameOver) this.setState({board: new ChessBoard('board', config)});
  },
  componentDidUpdate: function() {
    if (this.needsUpdate()) { // listen for new moves
      SetScroll($('.game-history-content')); // show bottom of history
      var moveAttributes = this.getMoveData();
      var move = this.state.chess.move(moveAttributes);
      var self = this;
      if (move) {
        if (this.state.chess.game_over()) {
          this.gameOverNotification();
        }
        self.updateStatus(moveAttributes.from, moveAttributes.to); // update status message
        self.state.board.position(self.state.chess.fen()); // update board
        self.switchTurn(); // change timer

      }
    }
  },
  componentWillUnmount: function() {
    Streamy.leave(this.props.game._id); // leave room
    Meteor.call('clearRooms'); // clear all empty rooms from Mongo
  },
  onDropCallback: function(source, target) {
    this.switchTurn(); // change timer
    this.persistMove(source, target); // send move to Mongo
    if (this.state.chess.game_over()) { // check for game over
      this.gameOver(this.props.userColor());
    }
  },
  onDragStart: function(source, piece, position, orientation) {
    var chess = this.state.chess;
    if (chess.game_over() === true ||
      (this.state.game.gameOver === true) ||
      (chess.turn() === 'w' && this.props.userColor() === 'black' ) ||
      (chess.turn() === 'b' && this.props.userColor() === 'white' ) ||
      (chess.turn() === 'w' && piece.search(/^b/) != -1) ||
      (chess.turn() === 'b' && piece.search(/^w/) != -1)) {
        return false;
    }
  },
  onSnapEnd: function() {
    this.state.board.position(this.state.chess.fen()); // update board on end of move
  },
  updateStatus: function(source, target) { // change message of game status
    var chess = this.state.chess;
    var status;
    var moveColor = chess.turn() === 'b' ? 'Black' : 'White';
    if (chess.in_checkmate() === true) { // checkmate?
      status = Statuses.gameOver(moveColor);
      this.clearIntervals(); // stop timers
    } else if (chess.in_draw() === true) { // draw?
      status = Statuses.draw();
      this.clearIntervals();
    } else { // regular play?
      status = Statuses.inPlay(moveColor);
    }
    if (chess.in_check() === true && chess.in_checkmate() != true)
      status += Statuses.inCheck(moveColor);
    return status;
  },
  switchTurn: function(undo) {
    if (this.state.chess.turn() === 'w') {
      this.switchTimers("blackInterval", "whiteTick", "whiteInterval");
    } else if (this.state.chess.turn() === 'b') {
      this.switchTimers("whiteInterval", "blackTick", "blackInterval");
    }
  },
  switchTimers: function(prev, next, interval) {
    clearInterval(this[prev]);
    this[interval] = setInterval(this[next], 1000);
    return;
  },
  getOpponent: function() {
    if (this.props.isPlayer() && this.props.userColor() == "black") {
      return this.state.game.white ? this.state.game.white : {name: "N/a"};
    } else {
      return this.state.game.black ? this.state.game.black : {name: "N/A"};
    }
  },
  gameOverNotification: function() {
    function showModal() {
      $('#myModal').modal('show');
      FB.XFBML.parse(document.getElementById('facebook_share'));
      TwitterShare();
    }
    setTimeout(showModal, 1000);
  },
  gameOver: function(color, status) {
    this.clearIntervals(); // stop timers
    var self = this;
    var p1 = new Promise(function(resolve, reject) {
      var gameStatus = self.state.chess.game_over() ? self.updateStatus() : status;
      data = { status: gameStatus, gameId: self.props.game._id, color: color };
      Meteor.call('gameOver', data, function(error, result) {
        if (error) console.log(error.reason);
        else
          resolve();
      });
    })
    p1.then(function(result) {
      function showModal() {
        $('#myModal').modal('show');
        FB.XFBML.parse(document.getElementById('facebook_share'));
        TwitterShare();
      }
      setTimeout(showModal, 1000);
    });
  },
  resign: function() {
    this.clearIntervals(); // stop timers
    var status = "Game over, " + this.props.userColor() + " resigns";
    data = { status: status, gameId: this.props.game._id, color: this.props.userColor() };
    Meteor.call('gameOver', data, function(error, result) {
      if (error) console.log(error.reason);
    });
    this.emitMessage('resigns');
  },
  acceptDraw: function() {
    this.clearIntervals(); // stop timers
    var status = 'Game drawn'
    data = { status: status, gameId: this.props.game._id };
    Meteor.call('gameDrawn', data, function(error, result) {
      if (error) console.log(error.reason);
    });
    this.gameOverNotification();
    this.emitMessage('accept_draw');
  },
  messageUpdate: function(stream, callback) {
    var self = this;
    Streamy.on(stream, function(data) {
      var p1 = new Promise(function(resolve, reject) {
        var params = { userId: self.props.getUserId(), username: self.props.getUsername(), messages: self.state.messages };
        resolve(callback(data, params));
      });
      p1.then(function(messages) {
        self.setState({messages: messages});
        SetScroll($('.user-messages-content'));
      });
    });
  },
  receiveDrawOffer: function() {
    this.messageUpdate('draw_offer', Streams.drawOffer);
  },
  receiveUndoRequest: function() {
    this.messageUpdate('undo_request', Streams.undoRequest);
  },
  receiveUndoDecline: function() {
    this.messageUpdate('decline_undo', Streams.undoDecline);
  },
  receiveDrawDecline: function() {
    this.messageUpdate('decline_draw', Streams.drawDecline);
  },
  receiveDrawAcception: function() {
    var self = this;
    Streamy.on('accept_draw', function(data) {
      self.gameOverNotification();
    });
  },
  receiveResignation: function() {
    var self = this;
    Streamy.on('resigns', function(data) {
      self.gameOverNotification();
    })
  },
  receiveUndoAcception: function() {
    var self = this;
    Streamy.on('accept_undo', function(data) {
      if (self.props.getUserId() == data.message) {
        self.state.chess.undo();
        self.state.board.position(self.state.chess.fen());
        self.switchTurn(true);
      }
    });
  },
  acceptUndo: function() {
    this.state.chess.undo();
    var data = {
      gameId: this.props.game._id,
      status: this.updateStatus(),
      pgn: this.state.chess.pgn(),
      history: this.state.chess.history()
    };
    Meteor.call('gameUndo', data, function(error, result) {
      if (error) console.log(error.reason);
    });
    this.state.board.position(this.state.chess.fen());
    this.switchTurn(true);
    this.emitMessage('accept_undo');
  },
  emitMessage: function(stream) {
    Streamy.rooms(this.props.game._id).emit(stream, {
      from: this.props.getUsername(),
      message: this.props.getOpponentId(),
      submitted: new Date()
    });
  },
  handleUndoRequest: function() {
    if (! this.state.game.gameOver && this.state.chess.turn() != this.currentPlayerTurn()) {
      this.emitMessage('undo_request');
    }
  },
  handleDrawOffer: function() {
    if (! this.state.game.gameOver) {
      this.emitMessage('draw_offer');
    }
  },
  getMoveData: function() {
    var source = this.state.moves ? this.state.moves.source : "";
    var target = this.state.moves ? this.state.moves.target : "";
    return {from: source, to: target, promotion: 'q'};
  },
  joinRoom: function() { // connect current user with Streamy room
    if (this.props.isPlayer()) {
      Streamy.join(this.props.game._id);
    }
  },
  currentPlayerTurn: function() {
    return this.props.userColor() == 'black' ? 'b' : 'w';
  },
  listenForMessages: function() { // Streamy event listener for messages
    var self = this;
    Streamy.on('outgoing_chat', function(data) {
      var messages = self.state.messages;
      messages.push(data);
      self.setState({messages: messages});
      SetScroll($('.user-messages-content'));
    });
  },

  needsUpdate: function() {
    return  (this.state.chess.turn() == 'b' && this.props.userColor() == 'white') ||
            (this.state.chess.turn() == 'w' && this.props.userColor() == 'black');
  },
  clearIntervals: function() {
    [this.blackInterval, this.whiteInterval].forEach(function(interval) {
      clearInterval(interval);
    });
  },
  blackTick: function() {
    this.tick("black", "white", "blackTimerSeconds");
  },
  whiteTick: function() {
    this.tick("white", "black", "whiteTimerSeconds");
  },
  tick: function(color, opposite, timer) {
    if (this.state[timer] == 0) {
      var status = "Game over, " + opposite + " wins on time";
      this.gameOver(color, status);
    } else if (! this.state.game.gameOver) {
      var newState = {};
      newState[timer] = this.state[timer] - 1;
      this.setState(newState);
    }
  },
  isFirstMove: function() {
    return this.state.chess.history().length === 1;
  },
  persistMove: function(source, target) { // send move to Mongo
    var params = {
      chess: this.state.chess,
      gameId: this.props.game._id,
      status: this.updateStatus(source, target),
      move: {source: source, target: target},
      whiteTimer: this.state.whiteTimerSeconds,
      blackTimer: this.state.blackTimerSeconds
    };
    var data = new DataHash(params).render();
    Meteor.call('gameUpdateFen', data, function(error, result) {
      if (error) console.log(error.reason);
    });
  },
  formatHistory: function() {
    var history = FormatHistory(this.state.game.history);
    return _.compact(history).map(function(data, idx) {
      return <HistoryLineComponent
                key={idx}
                number={data.number}
                notation={data.notation}
                lastMove={data.lastMove}
                last={data.last}
                next={data.next} />;
            });
  },
  getTimer: function(color) {
    return color == 'white' ? this.state.whiteTimerSeconds : this.state.blackTimerSeconds
  },
  render: function() {
    var content;
    var self = this;
    var currentUserTimer  = this.getTimer(this.props.userColor());
    var opponentTimer     = this.getTimer(this.props.getOpponentColor());
    var formattedHistory  = this.formatHistory();
    var bottomPlayer = this.props.getBottomPlayer(Meteor.userId()) || {name: "", rating: "", country: ""};
    var topPlayer = this.props.getTopPlayer(Meteor.userId()) || {name: "", rating: "", country: ""};
    var messages = this.state.messages.map(function(msg, idx) {
      return <MessageComponent
        idx={idx}
        msg={msg}
        key={idx}
        acceptDraw={self.acceptDraw}
        acceptUndo={self.acceptUndo}
        gameId={self.props.game._id}
        opponent={self.props.getOpponentId()}
        username={self.props.getUsername()}
        />;
    });
    content = <div className="game-wrapper">
                <div className="player-info">
                  <div className="other-player">
                    <Timer name={this.getOpponent().name} time={opponentTimer} />
                    <Profile user={topPlayer} />
                  </div>
                  <div className="current-player">
                    <Timer name={this.props.getUsername()} time={currentUserTimer} />
                    <Profile user={bottomPlayer} />
                  </div>
                </div>
                <BoardComponent handleResign={this.resign} handleDrawOffer={this.handleDrawOffer} analyzeGame={false} handleUndoRequest={this.handleUndoRequest}/>
                <div className="game-messages">
                  <StatusComponent status={this.state.game.status} />
                  <MessagesComponent messages={messages} gameId={this.props.game._id} username={this.props.getUsername()}/>
                  <HistoryComponent formattedHistory={formattedHistory} analyzeGame={false}/>
                </div>
              </div>;
    if (this.state.game.gameOver) {
      content = <AnalyzeGameComponent game={this.state.game} chess={this.state.chess} board={this.state.board} />
    }
    return (
      <div id="game-page-wrapper">
        {content}
      </div>
    );
  }
});
