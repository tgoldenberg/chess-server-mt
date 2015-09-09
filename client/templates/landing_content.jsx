function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

var Splash = ReactMeteor.createClass({
	templateName: "landingContent",

	getMeteorState: function() {
    return {
      availableUsers: AvailableUsers.find().fetch(),
      nextGame: NextGame.find().fetch(),
			currentUser: Session.get('currentUser'),
			userId: Session.get('userId')
    };
  },

	toggleForm: function() {
		if (Meteor.userId() == null && Session.get('currentUser') == undefined ) {
			$('#new-game').toggleClass('hidden');
		} else {
			var userId = Meteor.userId() ? Meteor.userId() : Session.get('userId');
			var name = Meteor.userId() == null ? Session.get('currentUser') : Meteor.user().username
			var availableUser = { userId: userId, name: name }
			var availableIds = _.pluck(AvailableUsers.find().fetch(), 'userId');
			var secondRequest = _.contains(availableIds, Session.get('userId')) || _.contains(availableIds, Meteor.userId());
			if (secondRequest) {
				alert('cannot request twice');
			} else if (AvailableUsers.find().count() > 0){
				 var gameId = AvailableUsers.find()[0].gameId;
				 Router.go('game', { _id: gameId });
			} else {
				// create game and go with router
				var availableUserId = "";
				Meteor.call('availableUserInsert', availableUser, function(error, result) {
					if (error) {
						// return throwError(error.reason)
						console.log(error.reason);
					}
					availableUserId = result._id;
				});
				// create game and go
				Meteor.call('gameInsert', availableUser, function(error, result) {
					if (error) {
						// return throwError(error.reason)
						console.log(error.reason);
						return;
					}
					AvailableUsers.update(availableUserId, {$set: {gameId: result._id}})
					Router.go('game', { _id: result._id });
				})
			}
		}
	},

	submitForm: function(e) {
		e.preventDefault()
		var name = $(e.target).find('input').val();
		$(e.target).find('input').val("");
		$('#new-game').toggleClass('hidden');
		Session.set('currentUser', name);
		Session.set('userId', makeid());
		var availableUser = {userId: Session.get('userId'), name: name };
		if (AvailableUsers.find().count() > 0 ) {
			// join game
			var availableUserId = "";
			var gameId = AvailableUsers.find().fetch()[0].gameId;
			var userId = AvailableUsers.find().fetch()[0]._id;
			var currentUsername = Meteor.userId() ? Meteor.user().username : Session.get('currentUser')
			var currentUserId = Meteor.userId() ? Meteor.userId() : Session.get('userId');
			var p1 = new Promise(function(resolve, reject){
				var data = {
					name: currentUsername,
					userId: currentUserId,
					gameId: gameId
				};
				console.log("DATA", data);
				Meteor.call('gameUpdate', data, function(error, result) {
					if (error)
						console.log(error.reason);
				})
				Meteor.call('availableUserDelete', userId, function(error, result) {
					if (error)
						console.log(error.reason);
				});
				resolve();
			});
			p1.then(function() {
				Router.go('game', { _id: gameId });
			});
		} else {
			// create game, go, and create available user
			Meteor.call("availableUserInsert", availableUser, function(error, result) {
				if (error)
					console.log(error);
				availableUserId = result._id;
			});

			var p1 = new Promise(function(resolve, reject) {
				// create game
				Meteor.call("gameInsert", availableUser, function(error, result) {
					if (error)
						console.log(error.reason);
					resolve(result._id);
				});
			});

			var p2 = p1.then(function(gameId) {
				// update user
				console.log("GAME ID", gameId);
				var data = {userId: availableUserId, gameId: gameId}
				Meteor.call("availableUserUpdate", data, function(error, result) {
					if (error)
						console.log(error.reason);
					Router.go('game', { _id: gameId });
				});
			});
		}
	},

	render: function() {
		return (
				<div className="content-holder">
					<div className="users-info">
						<div className="available-info">
							<p className="available-users">Available Users: {this.state.availableUsers.length}</p>
							<p>Logged In Users: </p>
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
})
