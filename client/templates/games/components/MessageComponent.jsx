MessageComponent = ReactMeteor.createClass({
  acceptDraw: function(e) {
    console.log("CLICK");
    e.preventDefault();
    this.props.acceptDraw();

  },
  acceptUndo: function(e) {
    var idx = $(e.target).attr('id');
    $('.draw-buttons button').addClass('hidden');
    this.props.acceptUndo(idx);
  },
  handleUndoDecline: function(e) {
    $('.draw-buttons button').addClass('hidden');
    Streamy.rooms(this.props.gameId).emit('decline_undo', {
      from: this.props.username, message: this.props.opponent, submitted: new Date()
    });
  },
  handleDrawDecline: function(e) {
    $('.draw-buttons button').addClass('hidden');
    Streamy.rooms(this.props.gameId).emit('decline_draw', {
      from: this.props.username, message: this.props.opponent, submitted: new Date()
    });
  },
  render: function() {
    var buttons = "";
    if (this.props.msg.draw) {
      buttons = <div className="draw-buttons"><button id={this.props.idx} onClick={this.acceptDraw}>Yes</button><button onClick={this.handleDrawDecline}>No</button></div>;
    }
    if (this.props.msg.undo) {
      buttons = <div className="draw-buttons"><button id={this.props.idx} onClick={this.acceptUndo}>Yes</button><button onClick={this.handleUndoDecline}>No</button></div>;
    }
    return (
      <div className="message" key={this.props.idx}>
        <p className="message-content">{this.props.msg.message}</p>
        {buttons}
        <p className="message-from">{this.props.msg.from}
          <span> {new Date(this.props.msg.submitted).toLocaleString()}</span>
        </p>
      </div>
    )
  }
})
