var Splash = ReactMeteor.createClass({
	templateName: "landingContent",
	getMeteorState: function() {
    return {
      availableUsers: AvailableUsers.find().fetch(),
			currentUser: Session.get('currentUser'),
			userId: Session.get('userId'),
			loggedInCount: Counts.get('loggedIn'),
			gamesInPlay: Counts.get('gamesCount'),
			totalGames: Counts.get('totalGames'),
			recentGames: Games.find({joinedAt: { $ne: null}}, {$sort: {createdAt: 1}, limit: 20})
    };
  },
	componentWillMount: function() {
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
	getUserRating: function()  {
		return Meteor.userId() ? Meteor.user().profile.rating : 1200;
	},
	getUserCountry: function() {
		return Meteor.userId() ? Meteor.user().profile.country : "United States";
	},
	getUserGamesWon: function() {
		return Meteor.userId() ? Meteor.user().profile.gamesWon : 0;
	},
	getUserGamesLost: function() {
		return Meteor.userId() ? Meteor.user().profile.gamesLost : 0;
	},
	getUserGamesPlayed: function() {
		return Meteor.userId() ? Meteor.user().profile.gamesPlayed : 0;
	},
  addSecondPlayer: function() {
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
  },
  createGame: function(availableUserId) {
    Meteor.call('gameInsert', this.userAttributes(), function(error, result) {
      if (error) {console.log(error.reason);}
      AvailableUsers.update(availableUserId, {$set: {gameId: result._id}})
      Router.go('game', { _id: result._id });
    });
  },
  userAttributes: function() {
    return {
			userId: this.getUserId(),
			name: this.getUsername(),
			rating: this.getUserRating(),
			country: this.getUserCountry(),
			gamesPlayed: this.getUserGamesPlayed(),
			gamesWon: this.getUserGamesWon(),
			gamesLost: this.getUserGamesLost()
		};
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
	facebookShare: function(e) {
		var url = $('#facebook_share').attr('href');
		return !window.open(url, 'Share on Facebook', 'width=640, height=536');
	},
	render: function() {
		var averageWait = 0;
		if (this.state.recentGames.count() > 0 ) {
			var timeDiff = 0;
			this.state.recentGames.map(function(game, idx) {
				timeDiff += (game.joinedAt - game.createdAt);
			});
			var milliseconds = timeDiff/this.state.recentGames.count();
			var seconds = Math.floor(milliseconds/1000);
			var points = ((milliseconds % 1000)/1000).toFixed(1).toString().slice(1);
		 	averageWait = `${seconds}${points} seconds`;
			console.log("AVG wait", timeDiff)
		}
		return (
			<div className="content-holder">
				<div className="users-info">
					<div className="available-info">
						<p className="available-users">Users Waiting to Play: {this.state.availableUsers.length}</p>
						<p>Logged In Users: {this.state.loggedInCount}</p>
            <p>Games in Play: {this.state.gamesInPlay}</p>
            <p>Total Games Played: {this.state.totalGames}</p>
            <p>Average Wait Time: {averageWait} </p>
            <p><a href="#">Leaderboard</a></p>
            <p><a href="#">View Games in Progress</a></p>
					</div>
					<div className="form-info">
						<h1>ChessMentor</h1>
						<button onClick={this.toggleForm}>PLAY</button>
						<form onSubmit={this.submitForm} id="new-game" className="hidden animated fadeIn">
							<label htmlFor="username">What's your name?</label><br/>
							<input type="text" name="username" autofocus/>
						</form><br/>
						<p className="fb-invite">Invite your friends to a game through Faceboook or Twitter!</p>
							<div className="social-share">
		            <a id="facebook_share" onClick={this.facebookShare} href="https://www.facebook.com/sharer/sharer.php?u=href=http://chessmentor.meteor.com&display=popup&ref=plugin">
		              <i className="fa fa-facebook"> Share</i>
		            </a>
		            <a
		              data-count="none"
		              href="https://twitter.com/intent/tweet?text=Come%20join%20me%20for%20a%20game%20of%20chess%20at%20http://speakitlanguages.com"
		              data-size="large">
		              <i className="fa fa-twitter"> Tweet</i>
		            </a>
		          </div>
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
