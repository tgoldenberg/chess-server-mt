FacebookShare = function() {
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.4&appId=1630516807228567";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
}
TwitterShare = function() {
  !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');
}
SetScroll =  function(domElement) {
  domElement.scrollTop(domElement[0].scrollHeight);
};
MakeId = function() {
  // function to create a unique ID for unregistered users
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < 5; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
};

FormatHistory = function(history) {
  var result = history.map(function(notation, idx) {
    var number = Math.ceil(idx/2) + 1;
    var lastMove = ""; var next = ""; var last = true;
    if (idx % 2 === 0 && idx + 1 != history.length) {
      next = history[idx + 1]; last = false;
      lastMove = idx + 2 === history.length ? "last-move" : "";
      return {number: number, notation: notation, lastMove: lastMove, last: last, next: next};
    }
    if (idx % 2 === 0) {
      return {number: number, notation: notation, lastMove: lastMove, last: last, next: next};
    }
  });
  return result;
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
  drawOffer: function(data, params) {
    var message = {from: data.from, submitted: data.submitted};
    if (params.userId == data.message) {
      message.message = Statuses.offerDraw(data.from); message.draw = true;
    } else if (params.username == data.from) {
      data.from = "Admin "; message.message = Statuses.messageSent();
    }
    var newMessages = params.messages;
    newMessages.push(message);
    return newMessages;
  },
  undoRequest: function(data, params) {
    var message = {from: data.from, submitted: data.submitted};
    if (params.userId == data.message) {
      message.message = Statuses.undoRequest(data.from); message.undo = true;
    } else if (params.username == data.from) {
      data.from = "Admin"; message.message = Statuses.undoSent();
    }
    var newMessages = params.messages;
    newMessages.push(message);
    return newMessages;
  },
  undoDecline: function(data, params) {
    var message = {from: data.from, submitted: data.submitted };
    if (params.userId == data.message) {
      message.message = Statuses.undoDecline(data.from);
    } else if (params.username == data.from) {
      data.from = "Admin"; message.message = Statuses.undoDeclineSent();
    }
    var newMessages = params.messages;
    newMessages.push(message);
    return newMessages;
  },
  drawDecline: function(data, params) {
    var message = {from: data.from, submitted: data.submitted };
    if (params.userId == data.message) {
      message.message = Statuses.drawDecline(data.from);
    } else if (params.username == data.from) {
      data.from = "Admin"; message.message = Statuses.drawDeclineSent();
    }
    var newMessages = params.messages;
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
    return ", " + moveColor + " is in check";
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
