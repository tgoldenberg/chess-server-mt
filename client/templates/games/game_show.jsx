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
    var cfg = _.extend(CFG, {
      position    : _.last(this.state.game.fen),
      draggable   : this.isPlayer(),
      orientation : this.userColor(),
      onDrop      : this.onDrop,
      onSnapEnd   : this.onSnapEnd,
      onDragStart : this.onDragStart
    });
    this.setState({board: new ChessBoard('board', cfg)}); // initialize chessboard
  },
  componentDidUpdate: function() {
    this.adjustHistoryScroll(); // show bottom of history
    if (this.needsUpdate()) { // listen for new moves
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
  onDrop: function(source, target) {
    var move = this.state.chess.move({from: source, to: target, promotion: 'q' }); // execute move
    if (move === null) return 'snapback';
    this.switchTurn(); // change timer
    this.persistMove(source, target); // send move to Mongo
    if (this.state.chess.game_over()) { // check for game over
      this.gameOver(this.userColor());
    }
  },
  onDragStart: function(source, piece, position, orientation) { // set draggability
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
      status = `Game over, ${moveColor} is in checkmate`;
      this.clearIntervals(); // stop timers
    }
    else if (chess.in_draw() === true){ // draw?
      status = 'Game over, drawn position';
      this.clearIntervals();
    }
    else // regular play?
      status = `${moveColor} to move`;
    if (chess.in_check() === true && chess.in_checkmate() != true)
      status += `, ${moveColor} is in check`;
    return status;
  },
  switchTurn: function(undo) {
    if (this.isFirstMove() && !undo) { // set black interval
      this.blackInterval = setInterval(this.blackTick, 1000);
    } else if ( this.isFirstMove() && undo) {
      clearInterval(this.whiteTick, 1000);
      this.blackInterval = setInterval(this.blackTick, 1000);
    } else if (! this.isFirstMove() && this.state.chess.turn() === 'w') {
      clearInterval(this.blackInterval);
      this.whiteInterval = setInterval(this.whiteTick, 1000);
    } else if (! this.isFirstMove() && this.state.chess.turn() === 'b') {
      clearInterval(this.whiteInterval);
      this.blackInterval = setInterval(this.blackTick, 1000);
    }
  },
  gameOver: function(color, status) {
    this.clearIntervals(); // stop timers
    var status = this.state.chess.game_over() ? this.updateStatus() : status;
    data = { status: status, gameId: this.props._id, color: color };
    Meteor.call('gameOver', data, function(error, result) {});
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
      var message = {from: data.from, submitted: data.submitted};
      if (this.getUserId() == data.message) {
        message.message = data.from + " offers a draw. Do you accept?";
        message.draw = true;
      } else if (this.getUsername() == data.from) {
        data.from = "Admin ";
        message.message = "Your draw request was successfully sent";
      }
      var messages = this.state.messages;
      messages.push(message);
      this.setState({messages: messages});
      this.setMessageScroll();
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
        message.message = data.from + " wishes to undo a move. Do you accept?";
        message.undo = true;
      } else if (this.getUsername() == data.from) {
        data.from = "Admin";
        message.message = "Your undo move request was successfully sent";
      }
      var messages = this.state.messages;
      messages.push(message);
      this.setState({messages: messages});
      this.setMessageScroll();
    }.bind(this));
  },
  handleUndoRequest: function() {
    console.log("UNDO REQUEST");
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
  submitMessage: function(e) {
    e.preventDefault();
    var message = $(e.target).find('input').val();
    $(e.target).find('input').val('');
    // send socket message via Streamy
    Streamy.rooms(this.props._id).emit('outgoing_chat',
      { from: this.getUsername(), message: message, submitted: new Date() });
  },
  joinRoom: function() { // connect current user with Streamy room
    if (this.isPlayer()) {
      Streamy.join(this.props._id);
    }
  },
  currentPlayerTurn: function() {
    return this.userColor() == 'black' ? 'b' : 'w';
  },
  setMessageScroll: function() { // scroll to bottom of messages
    var scroll = $('.user-messages-content')[0].scrollHeight;
    $('.user-messages-content').scrollTop(scroll);
  },
  listenForMessages: function() { // Streamy event listener for messages
    Streamy.on('outgoing_chat', function(data) {
      var messages = this.state.messages;
      messages.push(data);
      this.setState({messages: messages});
      this.setMessageScroll();
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
  adjustHistoryScroll: function() {
    var scroll = $('.game-history-content')[0].scrollHeight;
    $('.game-history-content').scrollTop(scroll);
  },
  clearIntervals: function() {
    clearInterval(this.blackInterval);
    clearInterval(this.whiteInterval);
  },
  blackTick: function() {
    if (this.state.blackTimerSeconds == 0) {
      this.gameOver('white', `Game over, white wins on time`);
    } else {
      this.setState({ blackTimerSeconds: this.state.blackTimerSeconds-1 });
    }
  },

  whiteTick: function() {
    if (this.state.whiteTimerSeconds == 0) {
      this.gameOver('black', `Game over, black wins on time`);
    } else {
      this.setState({ whiteTimerSeconds: this.state.whiteTimerSeconds-1 });
    }
  },
  isFirstMove: function() {
    return this.state.chess.history().length === 1;
  },
  persistMove: function(source, target) { // send move to Mongo
    var data = {};
    _.extend(data, {
      gameId: this.props._id,
      move: {source: source, target: target},
      status: this.updateStatus(source, target),
      fen: this.state.chess.fen(),
      history: this.state.chess.history(),
      pgn: this.state.chess.pgn(),
      whiteTimer: this.state.whiteTimerSeconds,
      blackTimer: this.state.blackTimerSeconds
    });
    Meteor.call('gameUpdateFen', data, function(error, result) {
      if (error) console.log(error.reason);
    });
  },
  formatHistory: function() {
    var history = this.state.game.history;
    return history.map(function(notation, idx) {
      var number = Math.ceil(idx/2) + 1;
      var lastMove = "";
      var last = true;
      var next = "";
      if (idx % 2 === 0 && idx + 1 != history.length) {
        next = history[idx + 1];
        lastMove = idx + 2 === history.length ? "last-move" : "";
        last = false;
      }
      if (idx % 2 === 0) {
        return (
          <HistoryLineComponent number={number} notation={notation} lastMove={lastMove} last={last} next={next} />
        );
      }
    });
  },
  render: function() {
    var currentUserTimer = this.userColor() == 'white' ? this.state.whiteTimerSeconds : this.state.blackTimerSeconds;
    var opponentTimer = this.userColor() == 'white' ? this.state.blackTimerSeconds : this.state.whiteTimerSeconds;
    var formattedHistory = this.formatHistory();
    var messages = this.state.messages.map(function(msg, idx) {
      return <MessageComponent idx={idx} msg={msg} acceptDraw={this.acceptDraw} acceptUndo={this.acceptUndo}/>;
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
            <MessagesComponent messages={messages} submitMessage={this.submitMessage} />
          </div>
        </div>
      </div>
    );
  }
});
