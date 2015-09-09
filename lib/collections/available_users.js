AvailableUsers = new Mongo.Collection('availableUsers');

AvailableUsers.allow({
  update: function(userId, availableUser) { return true; },
  remove: function(userId, availableUser) { return true; },
  insert: function(userId, availableUser) { return true; }
});

Meteor.methods({
  availableUserInsert: function(userAttributes) {
    check(userAttributes, {
      name: String,
      userId: String
    });

    var availableUser = _.extend(userAttributes, {
      submitted: new Date(),
      gameId: ""
    });

    var availableUserId = AvailableUsers.insert(availableUser);

    return {
      _id: availableUserId
    }
  }
});
