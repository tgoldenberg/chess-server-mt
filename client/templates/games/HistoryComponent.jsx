HistoryComponent = ReactMeteor.createClass({
  render: function() {
    return (
      <div>
        <p className="game-history">
          <span className="glyphicon glyphicon-th-list"></span>
          <span>History</span>
        </p>
        <div className="game-history-content">{this.props.formattedHistory}</div>
      </div>
    )
  }
})
