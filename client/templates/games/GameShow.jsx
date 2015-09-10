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
      currentUser: Meteor.user(),
      status: ""
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
  needsUpdate: function() {
    return  (this.state.chess.turn() == 'b' && this.userColor() == 'white') ||
            (this.state.chess.turn() == 'w' && this.userColor() == 'black');
  },
  componentDidUpdate: function() {
      if (this.needsUpdate()) {
      this.state.board.position(this.state.position);
      var source = this.state.moves ? this.state.moves.source : "";
      var target = this.state.moves ? this.state.moves.target : "";
      var move = this.state.chess.move({
        from: source,
        to: target,
        promotion: 'q'
      });
      if (move)
        this.updateStatus(source, target);
    }
  },
  updateStatus: function(source, target) {
    var chess = this.state.chess;
    var status = '';
    var moveColor = 'White';
    if (chess.turn() === 'b')
      moveColor = 'Black';
    // checkmate?
    if (chess.in_checkmate() === true)
      status = 'Game over, ' + moveColor + ' is in checkmate.';
    else if (chess.in_draw() === true)
      status = 'Game over, drawn position';
    else
      status = moveColor + ' to move';
    if (chess.in_check() === true)
      status += ', ' + moveColor + ' is in check';

    this.setState({status: status});
  },
  componentDidMount: function() {
    var chess = this.state.chess;
    Games.findOne(this.state.game._id).moves.forEach(function(move){
      this.state.chess.move({
        from: move.source,
        to: move.target,
        promotion: 'q'
      });
    }.bind(this));

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
      this.updateStatus(source, target);
    }.bind(this);

    var cfg = {
      pieceTheme: '/{piece}.png',
      position: _.last(this.props.fen),
      draggable: true,
      orientation: this.userColor(),
      onDrop: onDrop,
      onDragStart: onDragStart
    }
    this.setState({board: new ChessBoard('board', cfg)})
  },

  render: function() {
    var source = this.state.moves ? this.state.moves.source : "none"
    var history = this.state.chess.history();
    var formattedHistory = history.map(function(notation, idx) {
      var number = Math.ceil(idx/2) + 1;
      if (idx % 2 === 0 && idx + 1 == history.length) {
        return <p><span>{number}. {notation}</span></p>
      } else if (idx % 2 === 0) {
        var next = history[idx + 1];
        return <p><span>{number}. {notation}</span><span> || {next}</span></p>
      }
    });


    return (
      <div id="game-page-wrapper">
        <div className="game-wrapper">
          <div className="player-info">Hey</div>
          <div id="board"></div>
          <div className="game-messages">
            <p className="game-status">Status</p>
            <p className="game-status-content">{this.state.status}</p>
            <p className="game-history">History</p>
            <div className="game-history-content">{formattedHistory}</div>
            <p className="user-messages">Messages</p>
            <p className="user-messages-content">My Message</p>
          </div>
        </div>
        <div className="mobile-player-info">Hey</div>
        <div className="mobile-game-messages">Hi</div>
      </div>
    )
  }
});
