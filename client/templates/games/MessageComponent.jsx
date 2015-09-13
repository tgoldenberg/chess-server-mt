MessageComponent = ReactMeteor.createClass({
  handleClick: function(e) {
    console.log("CLICK");
    e.preventDefault();
    this.props.acceptDraw();

  },
  acceptUndo: function() {
    this.props.acceptUndo();
  },
  handleRefusal: function() {
    // TODO flesh out refuse call
    console.log("Refused");
  },
  render: function() {
    var buttons = "";
    if (this.props.msg.draw) {
      buttons = <div className="draw-buttons"><button onClick={this.handleClick}>Yes</button><button onClick={this.handleRefusal}>No</button></div>;
    }
    if (this.props.msg.undo) {
      buttons = <div className="draw-buttons"><button onClick={this.acceptUndo}>Yes</button><button>No</button></div>;
    }
    return (
      <div className="message" key={this.props.idx}>
        <p className="message-content">{this.props.msg.message}</p>
        {buttons}
        <p className="message-from">{this.props.msg.from}
          <span>{new Date(this.props.msg.submitted).toLocaleString()}</span>
        </p>
      </div>
    )
  }
})
