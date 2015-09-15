Timer = ReactMeteor.createClass({
  pad: function (num) {
    var str = num.toString();
    if (str.length < 2)
      str = "0" + str;
    return str;
  },
  formatTime: function(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return this.pad(m) + ":" + this.pad(s);
  },
  render: function() {
    return (
      <div className="timer">
        <div className="timer-header">
          <div className="timer-player">
            <span className="glyphicon glyphicon-hourglass"></span>
            <p>{this.props.name}</p>
          </div>
          <div className="minimize">
            <span className="glyphicon glyphicon-minus"></span>
          </div>
        </div>
        <div className="timer-holder">
          <div className="timer-content" id="white">{this.formatTime(this.props.time)}</div>
        </div>
      </div>
    );
  }
})
