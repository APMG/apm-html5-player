(function($) {
  // Required modules for page load
  'use strict';


  // Set up reference to parent module.
  var player;

  // Constructor
  // The 'parent' argument passed in is the parent object from Player.js.
  // This script is only intended to be used with that Player.js.
  var Playlist = function(parent) {
    player = parent;
    // The containing DOM element
    this.$el = player.$playlistElement;
  };

  // -----------------------------
  // Setup functions
  // -----------------------------

  Playlist.prototype.init = function() {
    this.selectElements()
    .setNextItem()
    .bindEventHandlers();
  };

  Playlist.prototype.selectElements = function() {
    this.$items = this.$el.find('.js-playlist-item');

    return this;
  };

  Playlist.prototype.setNextItem = function() {
    this.$items.each(function() {
      var $currentItem = $(this);
      var $nextItem = $(this).next();
      var nextSrc;

      if ($nextItem.length === 0) { return; }

      nextSrc = $nextItem.data('src');
      $currentItem.attr('data-next', nextSrc);
    });

    return this;
  };

  Playlist.prototype.bindEventHandlers = function() {
    this.$items.on('click', this.onItemClick.bind(this));

    return this;
  };

  // -----------------------------
  // Event Handlers
  // -----------------------------

  Playlist.prototype.onItemClick = function(e) {
    e.preventDefault();
    var $target = $(e.currentTarget);
    var src = $target.data('src');
    var title = $target.data('title');
    var artist = $target.data('artist');

    player.loadAudioFromSrc(src);
    player.playAudio();
    this.displayPlayedState($target);
    this.displayBufferingState($target);
    this.populatePlayerInfo(title, artist);
  };

  // -----------------------------
  // Helpers
  // -----------------------------

  Playlist.prototype.displayPlayedState = function($item) {
    this.removeDisplayStates();
    $item.addClass('is-playing');
  };

  Playlist.prototype.displayPlayingState = function($item) {
    this.removeBufferingState($item);
    this.removePausedState($item);
  };

  Playlist.prototype.displayPausedState = function($item) {
    $item.addClass('is-paused');
  };

  Playlist.prototype.removePausedState = function($item) {
    $item.removeClass('is-paused');
  };

  Playlist.prototype.displayBufferingState = function($item) {
    $item.addClass('is-loading');
  };

  Playlist.prototype.removeBufferingState = function($item) {
    $item.removeClass('is-loading');
  };

  Playlist.prototype.removeDisplayStates = function() {
    this.removeBufferingState(this.$items);
    this.$items.removeClass('is-active');
    this.$items.removeClass('is-paused');
    this.$items.removeClass('is-playing');
  };

  Playlist.prototype.populatePlayerInfo = function(title, artist) {
    player.$title.text(title);
    player.$artist.text(artist);
  };

  // Support Require.js
  if ( typeof define === "function" && define.amd ) {
    define(function() {
      return Playlist;
    });
  }
  else {
    window.Playlist = Playlist;
  }

})(jQuery);
