Template.splash.onRendered(function() {
  Meteor.subscribe('userStatus');
});
