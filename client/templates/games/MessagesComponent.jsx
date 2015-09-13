MessagesComponent = ReactMeteor.createClass({
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
          <form id="text-message" onSubmit={this.props.submitMessage}>
            <input type="text" placeholder="Your message here"/>
          </form>
        </div>
      </div>
    )
  }
})
