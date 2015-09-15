MessagesComponent = ReactMeteor.createClass({
  submitMessage: function(e) {
    e.preventDefault();
    var message = React.findDOMNode(this.refs.message).value;
    React.findDOMNode(this.refs.message).value = "";
    Streamy.rooms(this.props.gameId).emit('outgoing_chat',
      { from: this.props.username, message: message, submitted: new Date() });
  },
  render: function() {
    return (
      <div>
        <p className="user-messages">
          <span className="glyphicon glyphicon-envelope"></span>
          <span>Messages</span>
        </p>
        <div className="messages-holder">
          <div className="user-messages-content">
            {this.props.messages}
          </div>
          <form id="text-message" onSubmit={this.submitMessage}>
            <input type="text" ref="message" placeholder="Your message here"/>
          </form>
        </div>
      </div>
    )
  }
})
