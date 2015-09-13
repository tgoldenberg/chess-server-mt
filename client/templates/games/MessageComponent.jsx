MessageComponent = ReactMeteor.createClass({
  handleClick: function(e) {
    console.log("CLICK");
    e.preventDefault();
    this.props.acceptDraw();

  },
  render: function() {
    var buttons = "";
    if (this.props.msg.draw) {
      buttons = <div className="draw-buttons"><button onClick={this.handleClick}>Yes</button><button>No</button></div>;
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
