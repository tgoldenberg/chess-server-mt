Meteor.publish('games', function() {
  return Games.find();
});
Meteor.publish('nextGame', function() {
  return NextGame.find();
});
Meteor.publish('availableUsers', function() {
  var now = new Date();
  return AvailableUsers.find({
    submitted: {$gt: new Date(now - 10*60*1000)}
  });
});
Meteor.publish('singleGame', function(id) {
  check(id, String);
  return Games.find(id);
});

Meteor.publish('rooms', function(sid) {
  if(!sid)
    return this.error(new Meteor.Error('sid null'));
  return Streamy.Rooms.allForSession(sid);
});

Meteor.publish("userStatus", function() {
  Counts.publish(this, 'loggedIn', Meteor.users.find({ "status.online": true }));
});

Meteor.publish('gamesInPlay', function() {
  var now = new Date();
  Counts.publish(this, 'gamesCount', Games.find({completedAt: null}));
})

Meteor.publish('totalGames', function() {
  Counts.publish(this, 'totalGames', Games.find());
});

Meteor.publish('twentyGames', function() {
  return Games.find({}, {$sort: {createdAt: 1}, limit: 20});
});
