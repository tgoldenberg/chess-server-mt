Template.game.onRendered(function() {
  Streamy.onConnect(function() {
    Meteor.subscribe('rooms', Streamy.id());
  });
  FacebookShare();
});

Template.game.events({
  'click .end-game-buttons': function(e) {
    $('#myModal').modal('hide');
  },
  'click #new_game': function(e) {
    e.preventDefault();
    var game = function() {
      this.sameUser = function() {
        var availableIds = _.pluck(AvailableUsers.find().fetch(), 'userId');
        return _.contains(availableIds, Session.get('userId')) || _.contains(availableIds, Meteor.userId());
      };
      this.gameReady = function() {
        return AvailableUsers.find().count() > 0;
      };
      this.getUserId = function() {
        return Meteor.userId() ? Meteor.userId() : Session.get('userId');
      };
      this.getUsername = function() {
        return Meteor.userId() ? Meteor.user().username : Session.get('currentUser');
      };
      this.getUserRating = function() {
        return Meteor.userId() ? Meteor.user().profile.rating : 1200;
      };
      this.getUserGamesPlayed = function() {
        return Meteor.userId() ? Meteor.user().profile.gamesPlayed : 0;
      };
      this.getUserGamesWon = function() {
        return Meteor.userId() ? Meteor.user().profile.gamesWon : 0;
      };
      this.getUserGamesLost = function() {
        return Meteor.userId() ? Meteor.user().profile.gamesLost : 0;
      };
      this.getUserCountry = function() {
    		return Meteor.userId() ? Meteor.user().profile.country : "United States";
      };
      this.updateGame = function(data) {
        Meteor.call('gameUpdate', data, function(error, result) {
          if (error)
            console.log(error.reason);
        });
      };
      this.userAttributes = function() {
        return {
          userId: this.getUserId(),
          name: this.getUsername(),
          rating: this.getUserRating(),
          country: this.getUserCountry(),
          gamesPlayed: this.getUserGamesPlayed(),
          gamesWon: this.getUserGamesWon(),
          gamesLost: this.getUserGamesLost()
        };
      };
      this.addSecondPlayer = function() {
        var data = this.userAttributes();
        var userId = AvailableUsers.find().fetch()[0]._id
        var gameId = AvailableUsers.find().fetch()[0].gameId;
        var p1 = new Promise(function(resolve, reject){
          Meteor.call('availableUserDelete', userId, function(error, result) {
            if (error) {console.log(error.reason);}
            resolve();
          });
        });
        p1.then(function() {
          data.gameId = gameId;
          this.updateGame(data);
          Router.go('game', { _id: gameId });
        }.bind(this));
      };
      this.createGame = function(availableUserId, userAttributes) {
        Meteor.call('gameInsert', userAttributes, function(error, result) {
          if (error) {console.log(error.reason);}
          AvailableUsers.update(availableUserId, {$set: {gameId: result._id}})
          Router.go('game', { _id: result._id });
        });
      };
      this.createAvailableUser = function() {
        var availableUserId;
        var userAttributes = this.userAttributes();
        var p1 = new Promise(function(resolve, reject) {
          Meteor.call('availableUserInsert', userAttributes, function(error, result) {
            if (error) {console.log(error.reason);}
            resolve(result._id);
          });
        });
        p1.then(function(availableUserId) {
          this.createGame(availableUserId, userAttributes);
        }.bind(this))
      };
    };
    var currentGame = new game();

    if (currentGame.sameUser()) { // make sure user doesn't request twice
      alert('cannot request twice');
    } else if (currentGame.gameReady()) { // join to existing game
       currentGame.addSecondPlayer();
    } else { // create new game
      currentGame.createAvailableUser();
    }
  }
});

Template.game.helpers({
  dataHash: function() {
    var game = Games.findOne(this._id);
    var id = this._id
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
      return userColor() == "white" ? Games.findOne(id).black.userId : Games.findOne(id).white.userId;
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
