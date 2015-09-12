function pad(num) {
  var str = num.toString();
  if (str.length < 2)
    str = "0" + str;
  return str;
}

function now() {
  return (new Date()).getTime();
}

Timer = function(timeControl) {
  this.timeLeft = timeControl;
  this.lastTime = 0;
  this.timerInterval = null;
}

Timer.prototype = {
  time: function() {
    return this.timeLeft;
  },

  formattedTime: function() {
    var m = Math.floor(this.timeLeft / 60000);
    var s = Math.floor(this.timeLeft % 60000 / 1000);
    return pad(m) + ":" + pad(s);
  },

  sync: function(milli) {
    this.timeLeft = milli;
  },

  update: function() {
    var nextTime = now(),
        elapsedTime = nextTime - this.lastTime,
        newTime = this.timeLeft - elapsedTime;
    if (newTime > 0) {
      this.timeLeft = newTime;
    } else {
      this.timeLeft = 0;
      this.stop();
    }
    this.lastTime = nextTime;
  },

  start: function() {
    this.lastTime = now();
    if (this.timerInterval === null)
      this.timerInterval = setInterval(this.update.bind(this), 100);
  },

  stop: function() {
    if (this.timerInterval !== null)
      clearInterval(this.timerInterval);
    this.timerInterval = null;
  }
};
