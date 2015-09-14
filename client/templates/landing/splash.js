Template.splash.onRendered(function() {
  Meteor.subscribe('userStatus');
  Meteor.subscribe('gamesInPlay');
  Meteor.subscribe('totalGames');
  Meteor.subscribe('twentyGames');
  TwitterShare();
});
