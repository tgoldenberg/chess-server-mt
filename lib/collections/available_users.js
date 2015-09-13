AvailableUsers = new Mongo.Collection('availableUsers');

AvailableUsers.allow({
  update: function(userId, availableUser) { return true; },
  remove: function(userId, availableUser) { return true; },
  insert: function(userId, availableUser) { return true; }
});

var createBool = function() {
  return Math.random()<.5;
}

Meteor.methods({
  clearRooms: function() {
    Streamy.Rooms.clearEmpty();
  },
  availableUserInsert: function(userAttributes) {
    check(userAttributes, {
      name: String,
      userId: String,
      rating: Number,
      country: String,
      gamesPlayed: Number,
      gamesWon: Number,
      gamesLost: Number
    });
    var availableUser = _.extend(userAttributes, {
      submitted: new Date(),
      gameId: ""
    });
    var availableUserId = AvailableUsers.insert(availableUser);
    return {
      _id: availableUserId
    }
  },
  availableUserDelete: function(userId) {
    AvailableUsers.remove(userId);
  },
  availableUserUpdate: function(data) {
    AvailableUsers.update(data.userId, {$set: {gameId: data.gameId}});
  },
  gameOver: function(data) {
    check(data, {
      status: String,
      gameId: String,
      color: String
    });
    var winner = Games.findOne(data.gameId)[data.color];
    Games.update(data.gameId, {$set: {
      gameOver: true,
      status: data.status,
      winner: winner,
      completedAt: new Date()
    }});
  },
  gameDrawn: function(data) {
    check(data, {
      status: String,
      gameId: String
    });
    Games.update(data.gameId, {$set: {
      gameOver: true,
      draw: true,
      status: data.status,
      completedAt: new Date()
    }});
  },
  gameUndo: function(data) {
    check(data, {
      gameId: String,
      history: [Match.Any],
      pgn: String,
      status: String
    })
    Games.update(data.gameId, {$pop: {moves: 1, fen: 1, history: 1}});
    Games.update(data.gameId, {$set: {status: data.status, pgn: data.pgn}});
  },
  gameUpdateFen: function(data) {
    check(data, {
      gameId: String,
      fen: String,
      move: Object,
      status: String,
      history: [Match.Any],
      pgn: String,
      blackTimer: Number,
      whiteTimer: Number
    });
    var game = Games.findOne(data.gameId);
    Games.update(data.gameId, {$push: {moves: data.move, fen: data.fen }});
    Games.update(data.gameId, {$set: {
      status: data.status,
      history: data.history,
      pgn: data.pgn,
      blackTimer: data.blackTimer,
      whiteTimer: data.whiteTimer
    }});
  },
  gameUpdate: function(data) {
    check(data, {
      userId: String,
      name: String,
      gameId: String,
      rating: Number,
      gamesPlayed: Number,
      gamesWon: Number,
      gamesLost: Number,
      country: String
    });
    var game = Games.findOne(data.gameId);
    var userAttributes = {
      userId: data.userId,
      name: data.name,
      rating: data.rating,
      country: data.country,
      gamesPlayed: data.gamesPlayed,
      gamesWon: data.gamesWon,
      gamesLost: data.gamesLost
    }
    if (game && game.black == null) {
      Games.update(data.gameId, {$set: {
        black: userAttributes,
        status: "Black joined. Ready to start game.",
        joinedAt: new Date()
      }});
    } else {
      Games.update(data.gameId, {$set: {
        white: userAttributes,
        status: "White joined. Ready to start game.",
        joinedAt: new Date()
      }});
    }
  },
  gameInsert: function(userAttributes) {
    check(userAttributes, {
      name: String,
      userId: String,
      rating: Number,
      country: String,
      gamesPlayed: Number,
      gamesWon: Number,
      gamesLost: Number
    });
    var game = {
      createdAt: new Date(),
      joinedAt: null,
      completedAt: null,
      fen: ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
      pgn: "",
      moves: [],
      winner: "",
      gameOver: false,
      draw: false,
      history: [],
      blackTimer: 300,
      whiteTimer: 300
    }
    if (createBool()) {
      _.extend(game, {
        status: "Waiting for white player.",
        black: userAttributes,
        white: null,
      });
    } else {
      _.extend(game, {
        white: userAttributes,
        black: null,
        status: "Waiting for black player.",
      });
    }
    var gameId = Games.insert(game);
    return {
      _id: gameId
    }
  }
});
