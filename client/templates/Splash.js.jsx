var Splash = ReactMeteor.createClass({
	templateName: "landingContent",

	getMeteorState: function() {
    return {
      availableUsers: AvailableUsers.find().fetch(),
      nextGame: NextGame.find().fetch(),
			currentUser: Session.get('currentUser')
    };
  },

	toggleForm: function() {
		if (Meteor.userId() == null && Session.get('currentUser') == undefined ) {
			$('#new-game').toggleClass('hidden');
		} else {
			var userId = Meteor.userId() == null ? "123" : Meteor.userId();
			var name = Meteor.userId() == null ? Session.get('currentUser') : Meteor.user().username
			var availableUser = { userId: userId, name: name }
			Meteor.call('availableUserInsert', availableUser, function(error, result) {
				if (error) {
					// return throwError(error.reason)
					console.log(error.reason);
				}
			});
		}
	},

	submitForm: function(e) {
		e.preventDefault()
		var name = $(e.target).find('input').val();
		$(e.target).find('input').val("");
		$('#new-game').toggleClass('hidden');
		Session.set('currentUser', name);
		var availableUser = {userId: "", name: name };
		Meteor.call('availableUserInsert', availableUser, function(error, result) {
			if (error) {
				// return throwError(error.reason)
				console.log(error.reason);
			}
		});
	},

	render: function() {
		console.log(this.state.availableUsers);
		console.log(this.state.currentUser);
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
