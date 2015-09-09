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
