AvailableUsers = new Mongo.Collection('availableUsers');

AvailableUsers.allow({
  update: function(userId, availableUser) { return true; },
  remove: function(userId, availableUser) { return true; },
  insert: function(userId, availableUser) { return true; }
});
