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
  gameUpdate: function(data) {
    check(data, {
      userId: String,
      name: String,
      gameId: String
    });
    var game = Games.findOne(data.gameId);
    if (game.black == null) {
      Games.update(data.gameId, {$set: {
        black: {
          userId: data.userId,
          name: data.name
        }
      }});
    } else {
      Games.update(data.gameId, {$set: {
        white: {
          userId: data.userId,
          name: data.name
        }
      }})
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
        pgn: null,
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
        pgn: null,
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
