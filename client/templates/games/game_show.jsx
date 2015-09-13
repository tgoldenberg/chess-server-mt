var GameShow = ReactMeteor.createClass({
  templateName: "gameShow",
  getMeteorState: function() {
    return {
      game: Games.findOne(this.props._id),
      moves: _.last(Games.findOne(this.props._id).moves)
    };
  },
  getInitialState: function() {
    return {
      board: null,
      chess: new Chess(),
      messages: [],
      blackTimerSeconds: Games.findOne(this.props._id).blackTimer,
      whiteTimerSeconds: Games.findOne(this.props._id).whiteTimer
    }
  },
  componentDidMount: function() {
    this.state.chess.load_pgn(Games.findOne(this.props._id).pgn); // load previous games notation
    this.joinRoom(); // set up Streamy for messaging
    this.listenForMessages(); // event observer for messages
    this.receiveDrawOffer(); // listen for draw offer
    this.receiveUndoRequest(); // listen for undo requests
    this.receiveUndoAcception(); // listen for undo accept
    this.receiveUndoDecline(); // listen to decline of undo requests
    this.receiveDrawDecline(); // listen to decline of draw requests
    var data = {chess: this.state.chess};
    var config = new CFG(data, this.onDropCallback).render();
    var config = _.extend(config, {
      position    : _.last(this.state.game.fen),
      draggable   : this.isPlayer(),
      orientation : this.userColor(),
      onDragStart : this.onDragStart,
      onSnapEnd   : this.onSnapEnd
    });
    this.setState({board: new ChessBoard('board', config)}); // initialize chessboard
  },
  componentDidUpdate: function() {
    if (this.needsUpdate()) { // listen for new moves
      SetScroll($('.game-history-content')); // show bottom of history
      var moveAttributes = this.getMoveData()
      var move = this.state.chess.move(moveAttributes);
      if (move) {
        this.updateStatus(moveAttributes.from, moveAttributes.to); // update status message
        this.state.board.position(this.state.chess.fen()); // update board
        this.switchTurn(); // change timer
      }
    }
  },
  componentWillUnmount: function() {
    Streamy.leave(this.props._id); // leave room
    Meteor.call('clearRooms'); // clear all empty rooms from Mongo
  },
  onDropCallback: function(source, target) {
    this.switchTurn(); // change timer
    this.persistMove(source, target); // send move to Mongo
    if (this.state.chess.game_over()) { // check for game over
      this.gameOver(this.userColor());
    }
  },
  onDragStart: function(source, piece, position, orientation) {
    var chess = this.state.chess;
    if (chess.game_over() === true ||
      (this.state.game.gameOver === true) ||
      (chess.turn() === 'w' && this.userColor() === 'black' ) ||
      (chess.turn() === 'b' && this.userColor() === 'white' ) ||
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
    }
    else if (chess.in_draw() === true) { // draw?
      status = Statuses.draw();
      this.clearIntervals();
    }
    else // regular play?
      status = Statuses.inPlay(moveColor);
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
  gameOver: function(color, status) {
    this.clearIntervals(); // stop timers
    var status = this.state.chess.game_over() ? this.updateStatus() : status;
    data = { status: status, gameId: this.props._id, color: color };
    Meteor.call('gameOver', data, function(error, result) {
      if (error) console.log(error.reason);
    });
  },
  resign: function(color) {
    this.gameOver(color, `Game over, ${color} resigns`);
  },
  acceptDraw: function() {
    this.clearIntervals(); // stop timers
    var status = 'Game drawn'
    data = { status: status, gameId: this.props._id };
    Meteor.call('gameDrawn', data, function(error, result) {
      if (error) console.log(error.reason);
    });
  },
  receiveDrawOffer: function() {
    Streamy.on('draw_offer', function(data) {
      var messages = Streams.drawOffer(data, this.state.messages, this.setState, this.getUserId(), this.getUsername());
      setState({messages: messages});
      SetScroll($('.user-messages-content'));
    }.bind(this));
  },
  acceptUndo: function() {
    this.state.chess.undo();
    var data = {
      gameId: this.props._id,
      status: this.updateStatus(),
      pgn: this.state.chess.pgn(),
      history: this.state.chess.history()
    };
    Meteor.call('gameUndo', data, function(error, result) {
      if (error) console.log(error.reason);
    });
    this.state.board.position(this.state.chess.fen());
    this.switchTurn(true);
    Streamy.rooms(this.props._id).emit('accept_undo', {
      from: this.getUsername(), message: this.getOpponentId(), submitted: new Date()
    });
  },
  receiveUndoAcception: function() {
    Streamy.on('accept_undo', function(data) {
      if (this.getUserId() == data.message) {
        this.state.chess.undo();
        this.state.board.position(this.state.chess.fen());
        this.switchTurn(true);
      }
    }.bind(this));
  },
  receiveUndoRequest: function() {
    Streamy.on('undo_request', function(data) {
      var message = {from : data.from, submitted: data.submitted };
      if (this.getUserId() == data.message) {
        message.message = Statuses.undoRequest(data.from); message.undo = true;
      } else if (this.getUsername() == data.from) {
        data.from = "Admin"; message.message = Statuses.undoSent();
      }
      var messages = this.state.messages;
      messages.push(message);
      this.setState({messages: messages});
      var messageElement = $('.user-messages-content');
      SetScroll(messageElement);
    }.bind(this));
  },
  receiveUndoDecline: function() {
    Streamy.on('decline_undo', function(data) {
      var message = {from : data.from, submitted: data.submitted };
      if (this.getUserId() == data.message) {
        message.message = Statuses.undoDecline(data.from);
      } else if (this.getUsername() == data.from) {
        data.from = "Admin"; message.message = Statuses.undoDeclineSent();
      }
      var messages = this.state.messages;
      messages.push(message);
      this.setState({messages: messages});
      var messageElement = $('.user-messages-content');
      SetScroll(messageElement);
    }.bind(this));
  },
  receiveDrawDecline: function() {
    Streamy.on('decline_draw', function(data) {
      var message = {from: data.from, submitted: data.submitted };
      if (this.getUserId() == data.message) {
        message.message = Statuses.drawDecline(data.from);
      } else if (this.getUsername() == data.from) {
        data.from = "Admin"; message.message = Statuses.drawDeclineSent();
      }
      var messages = this.state.messages;
      messages.push(message);
      this.setState({messages: messages});
      var messageElement = $('.user-messages-content');
      SetScroll(messageElement);
    }.bind(this));
  },
  handleUndoRequest: function() {
    if (! this.state.game.gameOver && this.state.chess.turn() != this.currentPlayerTurn()) {
      Streamy.rooms(this.props._id).emit('undo_request', {
        from: this.getUsername(), message: this.getOpponentId(), submitted: new Date()
      });
    }
  },
  handleDrawOffer: function() {
    if (! this.state.game.gameOver) {
      Streamy.rooms(this.props._id).emit('draw_offer', {
        from: this.getUsername(), message: this.getOpponentId(), submitted: new Date()
      });
    }
  },
  getMoveData: function() {
    var source = this.state.moves ? this.state.moves.source : "";
    var target = this.state.moves ? this.state.moves.target : "";
    return {from: source, to: target, promotion: 'q'};
  },
  joinRoom: function() { // connect current user with Streamy room
    if (this.isPlayer()) {
      Streamy.join(this.props._id);
    }
  },
  currentPlayerTurn: function() {
    return this.userColor() == 'black' ? 'b' : 'w';
  },
  listenForMessages: function() { // Streamy event listener for messages
    Streamy.on('outgoing_chat', function(data) {
      var messages = this.state.messages;
      messages.push(data);
      this.setState({messages: messages});
      SetScroll($('.user-messages-content'));
    }.bind(this));
  },
  userColor: function() { // determine current user color
    if (this.checkGameColor("black"))
      return this.getUserColor("black", "white");
    else if (this.checkGameColor("white"))
      return this.getUserColor("white", "black");
  },
  checkGameColor: function(color) { // make sure color field is activated for Game
    return this.isPlayer() && this.state.game[color];
  },
  getUserColor: function(color, opposite) { // validate Meteor Id and Game.color
    return this.getUserId() == this.state.game[color].userId ? color : opposite;
  },
  getOpponentColor: function(color, opposite) {
    return this.userColor() == "white" ? "black" : "white";
  },
  isPlayer: function() { // is the current user part of the game?
    return _.contains([this.findPlayerId("black"), this.findPlayerId("white")], this.getUserId());
  },
  getOpponentId: function() {
    return this.userColor() == "white" ? this.state.game.black.userId : this.state.game.white.userId;
  },
  findPlayerId: function(key) { // check if Game has particular color attribute
    return this.props[key] ? this.props[key].userId : null;
  },
  getUserId: function() {
    return Meteor.userId() ? Meteor.userId() : Session.get('userId');
  },
  getUsername: function() {
    return Meteor.userId() ? Meteor.user().username : Session.get('currentUser');
  },
  getOpponentName: function() {
    var game = this.state.game;
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
      var game = this.state.game;
      return game.white ? game.white.name : "N/A";
    }
  },
  needsUpdate: function() {
    return  (this.state.chess.turn() == 'b' && this.userColor() == 'white') ||
            (this.state.chess.turn() == 'w' && this.userColor() == 'black');
  },
  clearIntervals: function() {
    clearInterval(this.blackInterval);
    clearInterval(this.whiteInterval);
  },
  blackTick: function() {
    if (this.state.blackTimerSeconds == 0) {
      this.gameOver('white', `Game over, white wins on time`);
    } else if(! this.state.game.gameOver ) {
      this.setState({ blackTimerSeconds: this.state.blackTimerSeconds-1 });
    }
  },
  whiteTick: function() {
    if (this.state.whiteTimerSeconds == 0) {
      this.gameOver('black', `Game over, black wins on time`);
    } else if(! this.state.game.gameOver ) {
      this.setState({ whiteTimerSeconds: this.state.whiteTimerSeconds-1 });
    }
  },
  isFirstMove: function() {
    return this.state.chess.history().length === 1;
  },
  persistMove: function(source, target) { // send move to Mongo
    var params = {
      chess: this.state.chess,
      gameId: this.props._id,
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
    var history = this.state.game.history;
    return history.map(function(notation, idx) {
      var number = Math.ceil(idx/2) + 1;
      var lastMove, next = ""; var last = true;
      if (idx % 2 === 0 && idx + 1 != history.length) {
        next = history[idx + 1]; last = false;
        lastMove = idx + 2 === history.length ? "last-move" : "";
      }
      if (idx % 2 === 0) {
        return (
          <HistoryLineComponent number={number} notation={notation} lastMove={lastMove} last={last} next={next} />
        );
      }
    });
  },
  getTimer: function(color) {
    return color == 'white' ? this.state.whiteTimerSeconds : this.state.blackTimerSeconds
  },
  render: function() {
    var currentUserTimer  = this.getTimer(this.userColor());
    var opponentTimer     = this.getTimer(this.getOpponentColor());
    var formattedHistory  = this.formatHistory();
    var messages = this.state.messages.map(function(msg, idx) {
      return <MessageComponent
        idx={idx}
        msg={msg}
        acceptDraw={this.acceptDraw}
        acceptUndo={this.acceptUndo}
        gameId={this.props._id}
        opponent={this.getOpponentId()}
        username={this.getUsername()}
        />;
    }.bind(this));
    return (
      <div id="game-page-wrapper">
        <div className="game-wrapper">
          <div className="player-info">
            <div className="other-player">
              <Timer name={this.getOpponentName()} time={opponentTimer} />
              <Profile name={this.getOpponentName()} rating={1200} gamesPlayed={4} country={"United States"}/>
            </div>
            <div className="current-player">
              <Timer name={this.getUsername()} time={currentUserTimer} />
              <Profile name={this.getBottomPlayerName()} rating={1200} gamesPlayed={4} country={"United States"} />
            </div>
          </div>
          <BoardComponent handleResign={this.handleResign} handleDrawOffer={this.handleDrawOffer} handleUndoRequest={this.handleUndoRequest}/>
          <div className="game-messages">
            <StatusComponent status={this.state.game.status} />
            <HistoryComponent formattedHistory={formattedHistory}/>
            <MessagesComponent messages={messages} gameId={this.props._id} username={this.getUsername()}/>
          </div>
        </div>
      </div>
    );
  }
});
