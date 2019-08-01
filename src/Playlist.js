// Required modules for page load
'use strict';

// Constructor
// The 'parent' argument passed in is the parent object from Player.js.
// This script is only intended to be used with that Player.js.
var Playlist = function(parent) {
  this.player = parent;
  // The containing DOM element
  this.el = this.player.playlistEl;
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
  this.itemEls = this.el.querySelectorAll('.js-playlist-item');

  return this;
};

Playlist.prototype.setNextItem = function() {
  Array.prototype.forEach.call(this.itemEls, function(currentItemEl) {
    var nextItemEl = currentItemEl.nextElementSibling;
    var nextSrc;

    if (!nextItemEl) {
      return;
    }

    nextSrc = nextItemEl.getAttribute('data-src');
    currentItemEl.setAttribute('data-next', nextSrc);
  });

  return this;
};

Playlist.prototype.bindEventHandlers = function() {
  var self = this;

  Array.prototype.forEach.call(this.itemEls, function(el) {
    el.addEventListener('click', self.onItemClick.bind(self));
  });

  return this;
};

// -----------------------------
// Event Handlers
// -----------------------------

Playlist.prototype.onItemClick = function(e) {
  e.preventDefault();
  var targetEl = e.currentTarget;
  var src = targetEl.getAttribute('data-src');
  var title = targetEl.getAttribute('data-title');
  var artist = targetEl.getAttribute('data-artist');

  this.player.el.setAttribute('data-src', src);
  this.player.loadAudioFromSources(src);
  this.player.playAudio();
  this.displayPlayedState(targetEl);
  this.displayBufferingState(targetEl);
  this.populatePlayerInfo(title, artist);
};

// -----------------------------
// Helpers
// -----------------------------

Playlist.prototype.displayPlayedState = function(el) {
  this.removeDisplayStates();
  el.classList.add('is-playing');
};

Playlist.prototype.displayPlayingState = function(el) {
  this.removeBufferingState(el);
  this.removePausedState(el);
};

Playlist.prototype.displayPausedState = function(el) {
  el.classList.add('is-paused');
};

Playlist.prototype.removePausedState = function(el) {
  el.classList.remove('is-paused');
};

Playlist.prototype.displayBufferingState = function(el) {
  el.classList.add('is-loading');
};

Playlist.prototype.removeBufferingState = function(el) {
  el.classList.remove('is-loading');
};

Playlist.prototype.removeDisplayStates = function() {
  var self = this;

  Array.prototype.forEach.call(this.itemEls, function(el) {
    self.removeBufferingState(el);
    self.removePausedState(el);
    el.classList.remove('is-playing');
    el.classList.remove('is-active');
  });
};

Playlist.prototype.populatePlayerInfo = function(title, artist) {
  this.player.titleEl.textContent = title;
  this.player.artistEl.textContent = artist;
};

export default Playlist;
