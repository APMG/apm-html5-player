(function() {
  'use strict';
  var $;
  var formatTime;
  var Playlist;
  var CreateTest = function($) {
    var Test = function() {
      console.log('Test');
      console.log($.fn.jquery);
    };
    return new Test();
  };

  if (typeof define === 'function' && define.amd) {
    define(['require', 'jquery', 'formattime', 'playlist'], function(require) {
      var FormatTime = require('formattime');
      $ = require('jquery');
      Playlist = require('playlist');
      formatTime = new FormatTime();
      return {
        init: function() {
          return new CreateTest($);
        },
      };
    });
  }
  else {
    $ = jQuery;
    return new CreateTest($);
    Playlist = window.Playlist;
    formatTime = new window.FormatTime();
    return new CreatePlayer($el, formatTime, Playlist);
  }
}());
