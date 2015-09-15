HistoryLineComponent = ReactMeteor.createClass({
  render: function() {
    var content;
    if (this.props.last) {
      content = <div className="history-line">
                  <p className="last-move">
                    <span className="numbers">{this.props.number}.</span>
                     {this.props.notation}
                  </p>
                </div>
    } else {
      content = <div className="history-line">
                  <p><span className="numbers">{this.props.number}.</span> {this.props.notation}</p>
                  <p className={this.props.lastMove}>{this.props.next}</p>
                </div>
    }
    return (
      <div>
        {content}
      </div>
    )
  }
})
