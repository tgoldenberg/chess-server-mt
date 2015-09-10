var GameShow = ReactMeteor.createClass({
  templateName: "gameShow",
  getMeteorState: function() {
    return {
      game: this.props,
      currentUserId: Meteor.userId(),
      currentUser: Meteor.user()
    };
  },
  isPlayer: function() {
    var userId = Meteor.userId() ? Meteor.userId() : Session.get('userId');
    var blackId = this.props.black ? this.props.black.userId : null;
    var whiteId = this.props.white ? this.props.white.userId : null;
    return blackId == userId || whiteId == userId;
  },
  componentDidMount: function() {
    console.log(this.isPlayer());
    var draggable = this.isPlayer();
    var cfg = {
      pieceTheme: '/{piece}.png',
      position: 'start',
      draggable: draggable
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
