var Splash = ReactMeteor.createClass({
	templateName: "landingContent",
	getMeteorState: function() {
    return {
      availableUsers: AvailableUsers.find().fetch(),
			currentUser: Session.get('currentUser'),
			userId: Session.get('userId')
    };
  },
  sendToGame: function() {
    if (this.sameUser()) { // make sure user doesn't request twice
      alert('cannot request twice');
    } else if (this.gameReady()) { // join to existing game
       this.addSecondPlayer();
    } else { // create new game
      this.createAvailableUser();
    }
  },
  sameUser: function() {
    var availableIds = _.pluck(AvailableUsers.find().fetch(), 'userId');
    return _.contains(availableIds, Session.get('userId')) || _.contains(availableIds, Meteor.userId());
  },
  gameReady: function() {
    return AvailableUsers.find().count() > 0;
  },
  addSecondPlayer: function() {
    var currentUserId = this.getUserId();
    var currentUserUsername = this.getUsername();
    var userId = AvailableUsers.find().fetch()[0]._id
    var gameId = AvailableUsers.find().fetch()[0].gameId;
    var p1 = new Promise(function(resolve, reject){
      Meteor.call('availableUserDelete', userId, function(error, result) {
        if (error) {console.log(error.reason);}
        resolve();
      });
    });
    p1.then(function() {
      var data = {
        userId: currentUserId,
        name: currentUserUsername,
        gameId: gameId
      };

      this.updateGame(data);

      Router.go('game', { _id: gameId });
    }.bind(this));
  },
  createGame: function(availableUserId) {
    Meteor.call('gameInsert', this.userAttributes(), function(error, result) {
      if (error) {console.log(error.reason);}
      AvailableUsers.update(availableUserId, {$set: {gameId: result._id}})
      Router.go('game', { _id: result._id });
    });
  },
  userAttributes: function() {
    return { userId: this.getUserId(), name: this.getUsername() };
  },
  getUserId: function() {
    return Meteor.userId() ? Meteor.userId() : Session.get('userId');
  },
  getUsername: function() {
    return Meteor.userId() ? Meteor.user().username : Session.get('currentUser');
  },
  noCurrentUser: function() {
    return Meteor.userId() == null && Session.get('currentUser') == undefined;
  },
  createAvailableUser: function() {
    var availableUserId;
    var userAttributes = this.userAttributes();
    var p1 = new Promise(function(resolve, reject) {
      Meteor.call('availableUserInsert', userAttributes, function(error, result) {
        if (error) {console.log(error.reason);}
        resolve(result._id);
      });
    });
    p1.then(function(availableUserId) {
      this.createGame(availableUserId);
    }.bind(this))
  },
	toggleForm: function() {
		if (this.noCurrentUser()) { // reveal form
			this.toggleFormVisibility();
		} else { // send to or create game
      this.sendToGame();
		}
	},
  toggleFormVisibility: function() {
    $('#new-game').toggleClass('hidden');
  },
  updateGame: function(data) {
    console.log("UPDATE GAME", data);
    Meteor.call('gameUpdate', data, function(error, result) {
      if (error)
        console.log(error.reason);
    });
  },
  deleteAvailableUser: function(userId) {
    return;
  },
	submitForm: function(e) {
		e.preventDefault()
		var name = $(e.target).find('input[name=username]').val();
		$(e.target).find('input[name=username]').val("");
		this.toggleFormVisibility();
    this.setSessionData(name);
		this.sendToGame();
	},
  setSessionData: function(name) {
    Session.set('currentUser', name);
		Session.set('userId', makeid());
  },
	render: function() {
		return (
			<div className="content-holder">
				<div className="users-info">
					<div className="available-info">
						<p className="available-users">Users Waiting to Play: {this.state.availableUsers.length}</p>
						<p>Logged In Users: </p>
            <p>Games in Play: </p>
            <p>Total Games Played: </p>
            <p>Average Wait Time: </p>
            <p><a href="#">Leaderboard</a></p>
					</div>
				<div className="form-info">
					<h1>ChessMentor</h1><br/><br/>
					<button onClick={this.toggleForm}>PLAY</button>
					<form onSubmit={this.submitForm} id="new-game" className="hidden animated fadeIn">
						<label htmlFor="username">What's your name?</label><br/>
						<input type="text" name="username" autofocus/>
					</form>
				</div>
				</div>
			</div>
		)
	}
});
// function to create a unique ID for unregistered users
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < 5; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}
