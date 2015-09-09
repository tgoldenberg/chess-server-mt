var GameShow = ReactMeteor.createClass({
  templateName: "gameShow",
  getMeteorState: function() {
    return {
      availableUsers: AvailableUsers.find().fetch(),
      nextGame: NextGame.find().fetch(),
			currentUser: Session.get('currentUser'),
			userId: Session.get('userId')
    };
  },
  render: function() {
    return (
      <h1>GAME SHOW</h1>
    )
  }
});
