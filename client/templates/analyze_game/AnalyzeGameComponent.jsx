AnalyzeGameComponent = ReactMeteor.createClass({
  getInitialState: function() {
    return {
      index: this.props.game.moves.length,
      board: null
    };
  },
  componentDidMount: function() {
    var config = {
      draggable: false,
      position: _.last(this.props.game.fen),
      pieceTheme: '/{piece}.png'
    };
    this.setState({board: new ChessBoard('board', config)});
  },

  formatHistory: function() {
    var history = FormatHistory(this.props.chess.history());
    return _.compact(history).map(function(data, idx) {
      return <HistoryLineComponent
                key={idx}
                number={data.number}
                notation={data.notation}
                lastMove={data.lastMove}
                last={data.last}
                next={data.next} />;
            });
  },
  updateStatus: function() {
    var chess = this.props.chess;
    var status;
    var moveColor = chess.turn() === 'b' ? 'Black' : 'White';
    if (chess.in_checkmate() === true) { // checkmate?
      status = Statuses.gameOver(moveColor);
    } else if (chess.in_draw() === true || (chess.history().length == this.props.game.moves.length && this.props.game.draw == true)) { // draw?
      status = Statuses.draw();
    } else if (this.props.game.moves.length == this.props.chess.history().length && this.props.game.gameOver == true) {
      status = this.props.game.status;
    } else { // regular play?
      status = Statuses.inPlay(moveColor);
    }
    if (chess.in_check() === true && chess.in_checkmate() != true)
      status += Statuses.inCheck(moveColor);
    return status;
  },
  back: function() {
    console.log("BACK");
    if (this.state.index > 0) {
      this.props.chess.undo();
      this.state.board.position(this.props.chess.fen());
      this.setState({index: this.state.index-1});
    }
  },
  forward: function() {
    console.log("FORWARD", this.state.index);
    var index = this.state.index;
    var nextMove = this.props.game.moves[index];
    console.log(nextMove);
    if (this.state.index < this.props.game.moves.length) {
      this.props.chess.move({from: nextMove.source, to: nextMove.target, promotion: 'q'});
      this.state.board.position(this.props.chess.fen());
      this.setState({index: this.state.index+1});
    }
  },
  goToStart: function() {
    console.log("Start");
    while (this.props.chess.history().length > 1) {
      this.props.chess.undo();
    }
    this.state.board.position(this.props.chess.fen());
    this.setState({index: 1});
  },
  goToEnd: function() {
    console.log("GOTO END");
    var numMoves = this.props.game.moves.length; // 11
    var index = this.state.index;
    for (i = index; i < numMoves; i++) {
      var nextMove = this.props.game.moves[i];
      this.props.chess.move({from: nextMove.source, to: nextMove.target, promotion: 'q'});
    }
    this.setState({index: numMoves});
    this.state.board.position(this.props.chess.fen());
  },
  skipBack: function() {
    console.log("SKIP BACK");
    var numMoves = this.props.game.moves.length;
    var index = this.state.index;
    var num = 0;
    for (i = 0; i < 3; i++) {
      if (index - i > 0) {
        this.props.chess.undo();
        num += 1;
      }
    }
    this.setState({index: index - num})
    this.state.board.position(this.props.chess.fen());
  },
  skipForward: function(){
    console.log("SKIP FORWARD");
    var numMoves = this.props.game.moves.length;
    var index = this.state.index;
    var num = 0;
    for (i = 0; i < 3; i++) {
      if (index + i < numMoves) {
        var nextMove = this.props.game.moves[index+i]
        this.props.chess.move({from: nextMove.source, to: nextMove.target, promotion: 'q'});
        num += 1;
      }
    }
    this.setState({index: index + num})
    this.state.board.position(this.props.chess.fen());
  },
  handleClick: function(e) {
    e.preventDefault();
    var action = $(e.target).attr('id');
    this[action]();
  },
  render: function() {
    var black = this.props.game.black;
    var white = this.props.game.white;
    var formattedHistory = this.formatHistory();
    var randomFunction = function() {};
    var beginning = "<<<";
    var nearBeginning = "<<";
    var prev = "<";
    var next = ">";
    var nearEnd = ">>";
    var ending = ">>>";
    console.log(this.state.index);

    return (
      <div className="game-wrapper">
        <div className="player-info">
          <div className="other-player">
            <Timer name={black.name} time={0} />
            <Profile user={black}/>
          </div>
          <div className="current-player">
            <Timer name={white.name} time={0} />
            <Profile user={white} />
          </div>
        </div>
        <BoardComponent handleClick={this.handleClick} handleResign={this.randomFunction} analyzeGame={true} handleDrawOffer={this.randomFunction} handleUndoRequest={this.randomFunction}/>
        <div className="game-messages">
          <StatusComponent status={this.updateStatus()} />
          <HistoryComponent formattedHistory={formattedHistory} analyzeGame={true}/>
        </div>
      </div>
    );
  }
});
