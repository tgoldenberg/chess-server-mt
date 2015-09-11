AvailableUsers = new Mongo.Collection('availableUsers');

AvailableUsers.allow({
  update: function(userId, availableUser) { return true; },
  remove: function(userId, availableUser) { return true; },
  insert: function(userId, availableUser) { return true; }
});

var validateAvailableUser = function(userAttributes) {
  console.log("validating Available User", userAttributes);
};
var createBool = function() {
  return Math.random()<.5;
}

Meteor.methods({
  availableUserInsert: function(userAttributes) {
    check(userAttributes, {
      name: String,
      userId: String
    });

    validateAvailableUser(userAttributes);

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
  gameUpdateFen: function(data) {
    check(data, {
      gameId: String,
      fen: String,
      move: Object,
      status: String,
      pgn: [Match.Any]
    });

    var game = Games.findOne(data.gameId);
    Games.update(data.gameId, {$push: {moves: data.move, fen: data.fen }});
    Games.update(data.gameId, {$set: {status: data.status, pgn: data.pgn }});
  },
  gameUpdate: function(data) {
    check(data, {
      userId: String,
      name: String,
      gameId: String,
    });
    var game = Games.findOne(data.gameId);
    if (game && game.black == null) {
      Games.update(data.gameId, {$set: {
        black: {
          userId: data.userId,
          name: data.name
        },
        status: "Black joined. Ready to start game."
      }});
    } else {
      Games.update(data.gameId, {$set: {
        white: {
          userId: data.userId,
          name: data.name
        },
        status: "White joined. Ready to start game."
      }});
    }
  },
  gameInsert: function(userAttributes) {
    check(userAttributes, {
      name: String,
      userId: String
    });
    var game;
    if (createBool()) {
      game = {
        black: userAttributes,
        white: null,
        createdAt: new Date(),
        joinedAt: null,
        completedAt: null,
        status: "Waiting for white player.",
        fen: ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
        pgn: [],
        moves: [],
        messages: [],
        timer: 300
      }
    } else {
      game = {
        white: userAttributes,
        black: null,
        createdAt: new Date(),
        joinedAt: null,
        completedAt: null,
        fen: ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
        pgn: [],
        moves: [],
        status: "Waiting for black player.",
        messages: [],
        timer: 300
      }
    }
    var gameId = Games.insert(game);

    return {
      _id: gameId
    }
  }
});
