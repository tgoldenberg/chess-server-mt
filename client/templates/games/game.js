Template.game.onRendered(function() {
  Streamy.onConnect(function() {
    Meteor.subscribe('rooms', Streamy.id());
  });
})
