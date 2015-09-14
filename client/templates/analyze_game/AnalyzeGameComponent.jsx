AnalyzeGameComponent = ReactMeteor.createClass({
  getInitialState: function() {
    return {
      board: null,
      chess: new Chess()
    };
  },
  componentDidMount: function() {
    this.state.chess.load_pgn(Games.findOne(this.props.game._id).pgn); // load previous games notation
    var config = {
      draggable: false,
      position: this.state.chess.fen(),
      pieceTheme: '/{piece}.png'
    };
    this.setState({board: new ChessBoard('board', config)});
  },
  formatHistory: function() {
    var history = FormatHistory(this.props.game.history);
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
  handleClick: function(e) {
    e.preventDefault();
    console.log($(e.target).attr('id'));
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
          <StatusComponent status={this.props.game.status} />
          <HistoryComponent formattedHistory={formattedHistory} analyzeGame={true}/>
        </div>
      </div>
    );
  }
});
