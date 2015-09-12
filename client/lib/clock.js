ChessClock = function(seconds, timesUp) {
  // data: color, time_control, white_name, black_name
  this.whiteTimer = new Timer(seconds);
  this.blackTimer = new Timer(seconds);
  this.whiteDisplay = $('#white');
  this.blackDisplay = $('#black');
  this.clockInterval = null;
  this.timesUp = timesUp;
}

ChessClock.prototype = {

  toggleTimers: function(turn) {
    if (turn === 'w') {
      this.blackTimer.stop();
      this.whiteTimer.start();
    } else {
      this.whiteTimer.stop();
      this.blackTimer.start();
    }
  },

  syncTimers: function(data) {
    this.whiteTimer.sync(data.white);
    this.blackTimer.sync(data.black);
  },

  timeData: function() {
    return {white: this.whiteTimer.time(),
            black: this.blackTimer.time()};
  },

  showTime: function() {
    this.whiteDisplay.text(this.whiteTimer.formattedTime());
    this.blackDisplay.text(this.blackTimer.formattedTime());

    if (this.flagged())
      this.timesUp();
  },

  start: function() {
    if (this.clockInterval === null) {
      this.clockInterval = setInterval(this.showTime.bind(this), 100);
      this.whiteTimer.start();
    }
  },

  stop: function() {
    if (this.clockInterval !== null) {
      clearInterval(this.clockInterval);
      this.whiteTimer.stop();
      this.blackTimer.stop();
    }
    this.clockInterval = null;
  },

  flagged: function() {
    return this.whiteTimer.time() === 0 || this.blackTimer.time() === 0;
  },

  winner: function() {
    if (this.whiteTimer.time() === 0) {
      return 'b';
    } else if (this.blackTimer.time() === 0) {
      return 'w';
    }
  }
};
