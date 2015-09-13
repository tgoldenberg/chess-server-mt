MessageComponent = ReactMeteor.createClass({
  render: function() {
    return (
      <div className="message" key={this.props.idx}>
        <p className="message-content">{this.props.msg.message}</p>
        <p className="message-from">{this.props.msg.from}
          <span>{new Date(this.props.msg.submitted).toLocaleString()}</span>
        </p>
      </div>
    )
  }
})
