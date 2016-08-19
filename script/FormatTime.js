(function() {
  'use strict';

  // Constructor
  var FormatTime = function() {};

  // Formats an ugly time (in seconds) to a nice readable format
  // e.g. 125 > 2:05, or 4226 > 1:10:26
  FormatTime.prototype.toFormatted = function(timeInSeconds) {
    timeInSeconds = Math.round(timeInSeconds);

    var formattedTime = '';
    var formattedMinutes = '';
    var formattedSeconds = '';
    var hours = Math.floor(timeInSeconds / 3600);
    var minutes = Math.floor((timeInSeconds / 60) - (hours * 60));
    var seconds = timeInSeconds - (minutes * 60) - (hours * 3600);

    if (hours !== 0) {
      formattedTime = hours + ':';

      if (minutes < 10) {
        formattedMinutes = '0' + minutes;
      } else {
        formattedMinutes = minutes.toString();
      }
    } else {
      formattedMinutes = minutes.toString();
    }

    if (seconds < 10) {
      formattedSeconds = '0' + seconds;
    } else {
      formattedSeconds = seconds.toString();
    }

    formattedTime = formattedTime + formattedMinutes + ':' + formattedSeconds;

    return formattedTime;
  };

  // Removes formatting from a timestamp, converting it to seconds
  // e.g. 2:05 > 125, or 1:10:26 > 4226
  FormatTime.prototype.toSeconds = function(formattedTime) {
    var arrHms = formattedTime.split(':');
    var arrSmh = arrHms.reverse();
    var timeInSeconds = 0;
    var seconds = parseInt(arrSmh[0] || 0);
    var minutes = parseInt(arrSmh[1] * 60 || 0);
    var hours = parseInt(arrSmh[2] * 3600 || 0);

    timeInSeconds = hours + minutes + seconds;

    return timeInSeconds;
  };

  if ( typeof define === "function" && define.amd ) {
    define(function() {
      return FormatTime;
    });
  }
  else {
    window.FormatTime = FormatTime;
  }
})();
