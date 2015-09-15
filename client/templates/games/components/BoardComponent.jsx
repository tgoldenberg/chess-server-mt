BoardComponent = ReactMeteor.createClass({
  render: function() {
    var content;
    if (! this.props.analyzeGame) {
      content = <div className="button-holder">
                  <div className="button">
                    <button onClick={this.props.handleDrawOffer}>Draw</button>
                  </div>
                  <div className="button">
                    <button onClick={this.props.handleResign}>Resign</button>
                  </div>
                  <div className="button">
                    <button onClick={this.props.handleUndoRequest}>Undo Move</button>
                  </div>
                </div>;
    } else {
      content = <div id="controls">
                  <button onClick={this.props.handleClick} className="back"    id="goToStart">&lt;&lt;&lt;</button>
                  <button onClick={this.props.handleClick} className="back"    id="skipBack">&lt;&lt;</button>
                  <button onClick={this.props.handleClick} className="back"    id="back">&lt;</button>
                  <button onClick={this.props.handleClick} className="forward" id="forward">&gt;</button>
                  <button onClick={this.props.handleClick} className="forward" id="skipForward">&gt;&gt;</button>
                  <button onClick={this.props.handleClick} className="forward" id="goToEnd">&gt;&gt;&gt;</button>
                </div>
    }
    return (
      <div className="board-holder">
        <div id="board"></div>
        {content}
      </div>
    )
  }
})
