var GameShow = ReactMeteor.createClass({
  templateName: "gameShow",
  getMeteorState: function() {
    return {
      game: this.props,
      currentUserId: Meteor.userId(),
      currentUser: Meteor.user()
    };
  },
  componentDidMount: function() {
    var cfg = {
      pieceTheme: '/{piece}.png',
      position: 'start',
      draggable: true
    };
    var board1 = ChessBoard('board', cfg);
  },
  render: function() {
    return (
      <div className="game-wrapper">
        <div id="board"></div>
      </div>
    )
  }
});
