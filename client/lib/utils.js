SetScroll =  function(domElement) {
  domElement.scrollTop(domElement[0].scrollHeight);
};

CFG = function(data, callback) {
  this.pieceTheme = '/{piece}.png';
  this.snapSpeed = 100;
  this.snapbackSpeed = 400;
  this.moveSpeed = 'slow';
  this.chess = data.chess;
  this.callback = callback;

  this.onDrop = function(source, target) {
    var move = this.chess.move({from: source, to: target, promotion: 'q' }); // execute move
    if (move === null) return 'snapback';
    else
      this.callback(source, target);
  }.bind(this);
};
CFG.prototype = {
  render: function() {
    return {
      pieceTheme: this.pieceTheme,
        snapSpeed: this.snapSpeed,
        snapbackSpeed: this.snapbackSpeed,
        moveSpeed: this.moveSpeed,
        onDrop: this.onDrop
    };
  }
}
Streams = {
  drawOffer: function(data, messages, setState, userId, username) {
    var message = {from: data.from, submitted: data.submitted};
    if (userId == data.message) {
      message.message = Statuses.offerDraw(data.from); message.draw = true;
    } else if (username == data.from) {
      data.from = "Admin "; message.message = Statuses.messageSent();
    }
    var newMessages = messages;
    newMessages.push(message);
    return newMessages;
  }
};

DataHash = function(data) {
  this.chess = data.chess;
  this.gameId = data.gameId;
  this.whiteTimer = data.whiteTimer;
  this.blackTimer = data.blackTimer;
  this.status = data.status;
  this.move = data.move;
  this.render = function() {
    return {
      gameId: this.gameId,
      move: this.move,
      status: this.status,
      fen: this.chess.fen(),
      history: this.chess.history(),
      pgn: this.chess.pgn(),
      whiteTimer: this.whiteTimer,
      blackTimer: this.blackTimer
    };
  }
}
Statuses = {
  gameOver: function(moveColor) {
    return "Game over, " + moveColor + " is in checkmate";
  },
  draw: function() {
    return 'Game over, drawn position';
  },
  inPlay: function(moveColor) {
    return moveColor + " to move";
  },
  inCheck: function(moveColor) {
    return moveColor + " is in check";
  },
  messageSent: function() {
    return "Your draw request was successfully sent";
  },
  offerDraw: function(username) {
    return username + " offers a draw. Do you accept?";
  },
  undoRequest: function(username) {
    return username + " wishes to undo a move. Do you accept?";
  },
  undoSent: function() {
    return "Your undo move request was successfully sent";
  },
  undoDecline: function(username) {
    return username + " declined your request";
  },
  drawDecline: function(username) {
    return username + " declined your request";
  },
  undoDeclineSent: function() {
    return "Successfully declined request";
  },
  drawDeclineSent: function() {
    return "Successfully declined request";
  }
};
