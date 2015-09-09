Meteor.publish('games', function() {
  return Games.find();
});
Meteor.publish('nextGame', function() {
  return NextGame.find();
});
Meteor.publish('availableUsers', function() {
  return AvailableUsers.find();
});
