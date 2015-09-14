Template.game.onRendered(function() {
  Streamy.onConnect(function() {
    Meteor.subscribe('rooms', Streamy.id());
  });
});

Template.game.helpers({
  dataHash: function() {
    var game = this;
    function userColor() {
      if (checkGameColor("black"))
        return getUserColor("black", "white");
      else if (checkGameColor("white"))
        return getUserColor("white", "black");
    };
    function checkGameColor(color) { // make sure color field is activated for Game
      return isPlayer() && game[color];
    };
    function getUserColor(color, opposite) { // validate Meteor Id and Game.color
      return getUserId() == game[color].userId ? color : opposite;
    };
    function getOpponentColor(color, opposite) {
      return userColor() == "white" ? "black" : "white";
    };
    function isPlayer() { // is the current user part of the game?
      return _.contains([findPlayerId("black"), findPlayerId("white")], getUserId());
    };
    function getOpponentId() {
      return userColor() == "white" ? game.black.userId : game.white.userId;
    };
    function findPlayerId(key) { // check if Game has particular color attribute
      return game[key] ? game[key].userId : null;
    };
    function getUserId() {
      return Meteor.userId() ? Meteor.userId() : Session.get('userId');
    };
    function getUsername() {
      return Meteor.userId() ? Meteor.user().username : Session.get('currentUser');
    };
    function getOpponentName() {
      if (isPlayer() && userColor() == "black") {
        return game.white ? game.white.name : "N/a";
      } else {
        return game.black ? game.black.name : "N/A";
      }
    };
    function getBottomPlayerName() {
      if (isPlayer()) {
        return getUsername();
      } else {
        return game.white ? game.white.name : "N/A";
      }
    };
    return {
      game: Games.findOne(this._id),
      userColor: userColor,
      checkGameColor: checkGameColor,
      getUserColor: getUserColor,
      checkGameColor: checkGameColor,
      getUserColor: getUserColor,
      getOpponentColor: getOpponentColor,
      isPlayer: isPlayer,
      getOpponentId: getOpponentId,
      findPlayerId: findPlayerId,
      getUserId: getUserId,
      getUsername: getUsername,
      getOpponentName: getOpponentName,
      getBottomPlayerName: getBottomPlayerName
    };
  }
});
