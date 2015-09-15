HistoryComponent = ReactMeteor.createClass({
  render: function() {
    var historyElement;
    if (! this.props.analyzeGame) {
      historyElement = <div className="game-history-content">{this.props.formattedHistory}</div>
    } else {
      historyElement = <div className="game-history-content game-history-analyze">{this.props.formattedHistory}</div>
    }
    return (
      <div>
        <p className="history-separator"></p>
        <p className="game-history">
          <span className="glyphicon glyphicon-th-list"></span>
          <span>History</span>
        </p>
        {historyElement}
      </div>
    )
  }
})
