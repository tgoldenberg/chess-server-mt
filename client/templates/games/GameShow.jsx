var GameShow = ReactMeteor.createClass({
  templateName: "gameShow",
  getMeteorState: function() {
    return {
      position: _.last(Games.findOne(this.props._id).fen),
      moves: _.last(Games.findOne(this.props._id).moves)
    };
  },
  getInitialState: function() {
    return {
      board: null,
      game: this.props,
      chess: new Chess(),
      currentUserId: Meteor.userId(),
      currentUser: Meteor.user()
    }
  },
  isPlayer: function() {
    var userId = this.getUserId();
    var blackId = this.props.black ? this.props.black.userId : null;
    var whiteId = this.props.white ? this.props.white.userId : null;
    return blackId == userId || whiteId == userId;
  },
  getUserId: function() {
    return Meteor.userId() ? Meteor.userId() : Session.get('userId');
  },
  userColor: function() {
    if (this.isPlayer() && this.state.game.black) {
      return this.getUserId() == this.state.game.black.userId ? "black" : "white";
    } else if (this.isPlayer() && this.state.game.white) {
      return this.getUserId() == this.state.game.white.userId ? "white" : "black";
    }
  },
  componentDidUpdate: function() {
    this.state.board.position(this.state.position);
    var source = this.state.moves ? this.state.moves.source : "";
    var target = this.state.moves ? this.state.moves.target : "";
    var move = this.state.chess.move({
      from: source,
      to: target,
      promotion: 'q'
    });
  },

  componentDidMount: function() {
    var chess = this.state.chess;
    var onDragStart = function(source, piece, position, orientation) {
      if (chess.game_over() === true ||
        (chess.turn() === 'w' && this.userColor() === 'black' ) ||
        (chess.turn() === 'b' && this.userColor() === 'white' ) ||
        (chess.turn() === 'w' && piece.search(/^b/) != -1) ||
        (chess.turn() === 'b' && piece.search(/^w/) != -1)) {
          return false;
        }
    }.bind(this);

    var onDrop = function(source, target) {
      var move = chess.move({
        from: source,
        to: target,
        promotion: 'q'
      });

      if (move === null) return 'snapback';
      var data = {
        gameId: this.state.game._id,
        move: {source: source, target: target},
        fen: chess.fen()
      }
      Meteor.call('gameUpdateFen', data, function(error, result) {
        if (error)
          console.log(error.reason);
      });
    }.bind(this);

    var cfg = {
      pieceTheme: '/{piece}.png',
      position: this.state.position,
      draggable: true,
      orientation: this.userColor(),
      snapSpeed: 100,
      snapbackSpeed: 400,
      moveSpeed: 'slow',
      onDrop: onDrop,
      onDragStart: onDragStart
    }
    this.setState({board: new ChessBoard('board', cfg)})
  },

  render: function() {
    var source = this.state.moves ? this.state.moves.source : "none"
    return (
      <div className="game-wrapper">
        <div style={{display: 'block'}}>
          <p>board: {this.state.position}</p>
          <p>chess: {this.state.chess.fen()}</p>
          <p><b>Source: {source}</b></p>
        </div>
        <div id="board"></div>
      </div>
    )
  }
});
