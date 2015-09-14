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
    } else if (chess.in_draw() === true) { // draw?
      status = Statuses.draw();
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
    console.log("FORWARD");
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
  skipBack: function() {
    console.log("SKIP BACK");
  },
  skipForward: function(){
    console.log("SKIP FORWARD");
  },
  goToEnd: function() {
    console.log("GOTO END");
    while (this.props.chess.history().length < this.props.game.moves.length-2) {
      var nextMove = this.props.game.moves[this.state.index];
      this.props.chess.move({from: nextMove.source, to: nextMove.target, promotion: 'q'});
      this.setState({index: this.state.index+1})
    }
    this.props.board.position(this.props.chess.fen());
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

    return (
      <div className="game-wrapper">
        <div className="player-info">
          <div className="other-player">
            <Timer name={black.name} time={0} />
            <Profile name={black.name} rating={black.rating} gamesPlayed={black.gamesPlayed} country={black.country}/>
          </div>
          <div className="current-player">
            <Timer name={white.name} time={0} />
            <Profile name={white.name} rating={1200} gamesPlayed={4} country={"United States"} />
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
