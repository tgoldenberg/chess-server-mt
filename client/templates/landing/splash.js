Template.splash.onRendered(function() {
  Meteor.subscribe('userStatus');
  Meteor.subscribe('gamesInPlay');
  Meteor.subscribe('totalGames');
  Meteor.subscribe('twentyGames');
  Meteor.subscribe('availableUsers');
  TwitterShare();
});

Template.splash.helpers({
  dataObject: function() {
    function sameUser() {
      var availableIds = _.pluck(AvailableUsers.find().fetch(), 'userId');
      return _.contains(availableIds, Session.get('userId')) || _.contains(availableIds, Meteor.userId());
    };
    function gameReady() {
      return AvailableUsers.find().count() > 0;
    };
  	function getUserRating()  {
  		return Meteor.userId() ? Meteor.user().profile.rating : 1200;
  	};
  	function getUserCountry() {
  		return Meteor.userId() ? Meteor.user().profile.country : "United States";
  	};
  	function getUserGamesWon() {
  		return Meteor.userId() ? Meteor.user().profile.gamesWon : 0;
  	};
  	function getUserGamesLost() {
  		return Meteor.userId() ? Meteor.user().profile.gamesLost : 0;
  	};
    function userAttributes() {
      return {
        userId: getUserId(),
        name: getUsername(),
        rating: getUserRating(),
        country: getUserCountry(),
        gamesPlayed: getUserGamesPlayed(),
        gamesWon: getUserGamesWon(),
        gamesLost: getUserGamesLost()
      };
    };
    function getUserGamesPlayed() {
      return Meteor.userId() ? Meteor.user().profile.gamesPlayed : 0;
    };
    function getUserId() {
      return Meteor.userId() ? Meteor.userId() : Session.get('userId');
    };
    function getUsername() {
      return Meteor.userId() ? Meteor.user().username : Session.get('currentUser');
    };
    function noCurrentUser() {
      return Meteor.userId() == null && Session.get('currentUser') == undefined;
    };
    return {
      userAttributes: userAttributes,
      getUserId: getUserId,
      getUsername: getUsername,
      sameUser: sameUser,
      gameReady: gameReady,
      getUserRating: getUserRating,
      getUserCountry: getUserCountry,
      getUserGamesWon: getUserGamesWon,
      getUserGamesLost: getUserGamesLost,
      getUserGamesPlayed: getUserGamesPlayed,
      noCurrentUser: noCurrentUser
    };
  }
})
