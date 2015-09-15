StatusComponent = ReactMeteor.createClass({
  render: function() {
    return (
      <div>

      <p className="game-status">
        <span className="glyphicon glyphicon-check"></span>
        <span>Status</span>
      </p>
      <p className="game-status-content">{this.props.status}</p>
      </div>
    );
  }
})
