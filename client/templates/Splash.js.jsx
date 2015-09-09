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
		if (! Meteor.userId())
			$('#new-game').toggleClass('hidden');
	},

	submitForm: function(e) {
		e.preventDefault()
		var name = $(e.target).find('input').val();
		$(e.target).find('input').val("");
		$('#new-game').toggleClass('hidden');
		Session.set('currentUser', name);
	},

	render: function() {
		console.log(this.state.availableUsers);
		console.log(this.state.currentUser);
		return (
				<div className="content-holder">
					<h1>ChessMentor</h1><br/><br/>
					<button onClick={this.toggleForm}>PLAY</button>
					<div>

					<form onSubmit={this.submitForm} id="new-game" className="hidden animated fadeIn">
						<label htmlFor="username">What's your name?</label><br/>
						<input type="text" name="username" autofocus/>
					</form>
					</div>
				</div>


		)
	}
})
