import { toFormatted } from './FormatTime';
import Playlist from './Playlist';
// import Playlist from './Playlist';

// Constants
var PLAYING_CLASS = 'is-playing';
var PAUSED_CLASS = 'is-paused';
var LOADING_CLASS = 'is-loading';
var MUTED_CLASS = 'is-muted';

// Constructor
var Player = function(el, options) {
  // The containing DOM element
  this.el = el;

  // An object with player options
  this.options = options;

  // The playing/paused state of the Player
  this.isPlaying = false;

  // A variable to store the previous volume the player was set at.
  this.storedVolume = 1;

  // References to the playlist
  this.playlistSelector = this.el.getAttribute('data-playlist');
  this.playlistEl = document.querySelector(this.playlistSelector);
  // The playlist module, initialized later
  this.playlist;
  // Set to true when playlist is initialized
  this.hasPlaylist = false;
};

// -----------------------------
// Initialized functions
// -----------------------------

// Initialize the module
Player.prototype.init = function() {
  this.selectElements()
    .initPlaylist()
    .getSources()
    .bindEventHandlers()
    .initTime()
    .displayCurrentVolume();

  return this;
};

// Descendant elements of the containing DOM element
Player.prototype.selectElements = function() {
  // The audio element used for playback
  this.audioEl = this.el.querySelector('audio');
  // Controls
  this.playButtonEls = this.el.querySelectorAll('.js-player-play');
  this.skipForwardButtonEl = this.el.querySelector('[data-skip-forward]');
  this.skipBackButtonEl = this.el.querySelector('[data-skip-back]');
  this.timelineEl = this.el.querySelector('.js-player-timeline');
  this.timelineProgressEl =
    this.timelineEl && this.timelineEl.querySelector('.js-player-progress');
  this.timelineBufferedEl =
    this.timelineEl && this.timelineEl.querySelector('.js-player-buffered');
  this.volumeBarEl = this.el.querySelector('.js-player-volume');
  this.currentVolumeEl =
    this.volumeBarEl &&
    this.volumeBarEl.querySelector('.js-player-volume-current');
  this.muteButtonEl = this.el.querySelector('.js-player-mute');
  // Info
  this.durationEl = this.el.querySelector('.js-player-duration');
  this.currentTimeEl = this.el.querySelector('.js-player-currentTime');
  this.titleEl = this.el.querySelector('.js-player-title');
  this.artistEl = this.el.querySelector('.js-player-artist');

  return this;
};

Player.prototype.getSources = function() {
  // Get data-src attribute each time this is called in case the attribute changes
  try {
    this.sources = JSON.parse(
      // decodeURI is used in case any URL characters (like %20 for spaces) are in the string
      decodeURI(this.el.getAttribute('data-src')).replace(/'/g, '"')
    );
  } catch (e) {
    if (typeof console !== 'undefined') {
      // If the error is anything other than not evaluating to JSON, print to console
      var syntaxReg = /^\s*SyntaxError: Unexpected token|^\s*SyntaxError: Unexpected end of JSON input/;
      if (!syntaxReg.test(e)) {
        // eslint-disable-next-line
        console.log(e);
      }
    }

    this.sources = this.el.getAttribute('data-src');
  }

  return this;
};

// Setup and bind event handlers
Player.prototype.bindEventHandlers = function() {
  var self = this;

  // Click events

  // Apply click event to all play buttons
  Array.prototype.forEach.call(this.playButtonEls, function(el) {
    el.addEventListener('click', self.onPlayClick.bind(self));
  });

  this.skipForwardButtonEl &&
    this.skipForwardButtonEl.addEventListener(
      'click',
      this.onSkipForwardClick.bind(this)
    );

  this.skipBackButtonEl &&
    this.skipBackButtonEl.addEventListener(
      'click',
      this.onSkipBackClick.bind(this)
    );

  this.timelineEl &&
    this.timelineEl.addEventListener('click', this.onTimelineClick.bind(this));

  this.volumeBarEl &&
    this.volumeBarEl.addEventListener('click', this.onVolumeClick.bind(this));

  this.muteButtonEl &&
    this.muteButtonEl.addEventListener('click', this.onMuteClick.bind(this));

  // Audio element events
  this.audioEl.addEventListener('play', this.onAudioPlay.bind(this));
  this.audioEl.addEventListener('pause', this.onAudioPause.bind(this));
  this.audioEl.addEventListener(
    'timeupdate',
    this.onAudioTimeupdate.bind(this)
  );
  this.audioEl.addEventListener('waiting', this.onAudioWaiting.bind(this));
  this.audioEl.addEventListener('playing', this.onAudioPlaying.bind(this));
  this.audioEl.addEventListener('ended', this.onAudioEnded.bind(this));
  this.audioEl.addEventListener('volumechange', this.onVolumeChange.bind(this));
  this.audioEl.addEventListener(
    'loadedmetadata',
    this.onLoadedMetadata.bind(this)
  );
  this.audioEl.addEventListener('progress', this.onProgress.bind(this));

  return this;
};

Player.prototype.initTime = function() {
  this.displayCurrentTime();
  return this;
};

Player.prototype.initPlaylist = function() {
  if (this.playlistEl) {
    this.playlist = new Playlist(this);
    this.playlist.init();
    this.hasPlaylist = true;
  }

  return this;
};

// -----------------------------
// Event Handlers
// -----------------------------

Player.prototype.onPlayClick = function(e) {
  e.preventDefault();
  this.handlePlay();
};

// handler is separated from actual click event so it can be called
// externally (e.g. from play buttons outside of the player interface)
Player.prototype.handlePlay = function() {
  if (this.isPlaying === false) {
    if (this.audioEl.readyState === 0) {
      // get sources from data attribute in case it changed
      this.getSources();
      this.loadAudioFromSources(this.sources);
    }
    this.playAudio();
  } else {
    this.pauseAudio();
    if (this.audioEl.duration === Infinity) {
      this.unloadAudio();
    }
  }
};

Player.prototype.onSkipForwardClick = function(e) {
  var targetEl = e.currentTarget;
  var seconds = targetEl.getAttribute('data-skip-forward');

  e.preventDefault();

  if (this.audioEl.duration === Infinity) {
    return;
  }

  this.skipForward(seconds);
};

Player.prototype.onSkipBackClick = function(e) {
  var targetEl = e.currentTarget;
  var seconds = targetEl.getAttribute('data-skip-back');

  e.preventDefault();

  if (this.audioEl.duration === Infinity) {
    return;
  }

  this.skipBack(seconds);
};

Player.prototype.onTimelineClick = function(e) {
  var targetEl = e.currentTarget;
  var clickXPosition = e.pageX;
  var seconds = this.getSecondsByClickPosition(targetEl, clickXPosition);

  e.preventDefault(e);

  this.seekTime(seconds);
};

Player.prototype.onVolumeClick = function(e) {
  var targetEl = e.currentTarget;
  var volume;

  if (targetEl.getAttribute('data-volume-direction') === 'h') {
    var clickXPosition = e.pageX;
    volume = this.getVolumeByHorizClickPosition(targetEl, clickXPosition);
  } else {
    var clickYPosition = e.pageY;
    volume = this.getVolumeByVertClickPosition(targetEl, clickYPosition);
  }

  e.preventDefault();

  this.changeVolume(volume);
};

Player.prototype.onMuteClick = function(e) {
  e.preventDefault();

  if (this.audioEl.volume !== 0) {
    this.muteAudio();
  } else {
    this.unmuteAudio();
  }
};

// HTMLMediaElement 'play' event fires when a request
// to play the audio has occurred. Does not necessarily mean the
// audio is actually playing. (see 'playing' event)
Player.prototype.onAudioPlay = function() {
  this.isPlaying = true;
  this.displayPlayedState();
};

// HTMLMediaElement 'pause' event fires when the audio gets paused
Player.prototype.onAudioPause = function() {
  this.isPlaying = false;
  this.displayPausedState();
};

// HTMLMediaElement 'timeupdate' event fires while the audio is playing
// and the current time changes, usually several times per second
Player.prototype.onAudioTimeupdate = function() {
  this.displayCurrentTime();
  this.sendToNielsen('setPlayheadPosition', Date.now() / 1000);
};

// HTMLMediaElement 'waiting' event fires when audio is downloading
// or interrupted, such as when buffering at first play
Player.prototype.onAudioWaiting = function() {
  this.displayBufferingState();
};

// HTMLMediaElement 'playing' event fires when audio has actually
// begun playing (after being loaded)
Player.prototype.onAudioPlaying = function() {
  this.displayPlayingState();
};

// HTMLMediaElement 'ended' event fires when audio playback has
// finished for the current file
Player.prototype.onAudioEnded = function() {
  this.displayStoppedState();
  if (this.hasPlaylist === true) {
    this.playNext();
  }
};

// HTMLMediaElement 'volumechange' event fires when the audio's
// volume changes
Player.prototype.onVolumeChange = function() {
  this.displayCurrentVolume();
};

// HTMLMediaElement 'onLoadedMetadata' event fires when the audio's
// metadata has been downloaded
Player.prototype.onLoadedMetadata = function() {
  this.displayDuration();
  this.sendToNielsen('loadMetadata', window.nielsenMetadataObject);
};

// HTMLMediaElement 'progress' event fires when any data
// gets downloaded
Player.prototype.onProgress = function() {
  this.displayTimeRanges();
};

// -----------------------------
// Audio Element Methods
// -----------------------------

Player.prototype.loadAudioFromSources = function(sources) {
  // Remove the src attribute on the audio element in case it was left in the HTML.
  // An empty src attribute will interfere with the inner <source> elements.
  this.audioEl.removeAttribute('src');
  // Clear any existing <source> elements
  this.audioEl.innerHTML = '';

  if (typeof sources === 'string') {
    // Turn a string value into an array with one item
    // This is in this function so that loadAudioFromSources()
    // can be called externally with a string if needed
    sources = sources.split();
  }

  this.createSourceEls(sources);
  this.audioEl.load();
};

Player.prototype.createSourceEls = function(sources) {
  var self = this;
  // Append <source> elements to the <audio> element
  sources.forEach(function(source) {
    var sourceUrl;
    var sourceType;

    // if using a source object, get the type from the object,
    // fall back to figure it out based on the filename
    if (typeof source === 'object' && !Array.isArray(source)) {
      sourceUrl = source.url;
      sourceType = source.type;
    } else {
      sourceUrl = source;
      sourceType = self.getSourceType(source);
    }

    // Generate the html
    var sourceEl = document.createElement('source');
    sourceEl.setAttribute('src', sourceUrl);
    // Only set a type if sourceType is not null
    if (sourceType !== null) {
      sourceEl.setAttribute('type', sourceType);
    }
    self.audioEl.appendChild(sourceEl);
  });
};

Player.prototype.getSourceType = function(source) {
  // We don't test for only the end of the filename in case
  // there is a cache busting string on the end
  var aacReg = /\.aac/;
  var mp4Reg = /\.mp4/;
  var m4aReg = /\.m4a/;
  var oggReg = /\.ogg|\.oga/;
  var mp3Reg = /\.mp3/;

  if (aacReg.test(source)) {
    return 'audio/aac';
  } else if (mp4Reg.test(source)) {
    return 'audio/mp4';
  } else if (oggReg.test(source)) {
    return 'audio/ogg';
  } else if (m4aReg.test(source)) {
    return 'audio/m4a';
  } else if (mp3Reg.test(source)) {
    return 'audio/mpeg';
  } else {
    return null;
  }
};

Player.prototype.sendToNielsen = function(key, value) {
  if (window.nSdkInstance && this.audioEl.duration === Infinity) {
    window.nSdkInstance.ggPM(key, value);
  }
};

Player.prototype.unloadAudio = function() {
  this.isPlaying = false;
  // Remove inner <source> elements
  this.audioEl.innerHTML = '';
  // Forces the audio element to read the (nonexistent) <source> elements and update
  this.audioEl.load();
  this.displayStoppedState();
  this.sendToNielsen('stop', Date.now() / 1000);
};

Player.prototype.playAudio = function() {
  this.pauseAllAudio();
  this.audioEl.play();
};

Player.prototype.pauseAudio = function(currentAudio) {
  if (typeof currentAudio !== 'undefined') {
    currentAudio.pause();
  } else {
    this.audioEl.pause();
  }
};

Player.prototype.pauseAllAudio = function() {
  // Pause any audio that may already be playing on the page.
  var self = this;
  var audioEls = document.querySelectorAll('audio');
  Array.prototype.forEach.call(audioEls, function(el) {
    self.pauseAudio(el);
  });
};

Player.prototype.playNext = function() {
  var nextSrc = this.getNextPlaylistSrc();

  var nextItemEl;

  if (typeof nextSrc === 'undefined' || nextSrc === null) return;

  this.el.setAttribute('data-src', nextSrc);
  nextItemEl = this.findNext(nextSrc);
  this.playlist.populatePlayerInfo(
    nextItemEl.getAttribute('data-title'),
    nextItemEl.getAttribute('data-artist')
  );
  this.loadAudioFromSources(nextSrc);
  this.playAudio();
};

Player.prototype.findNext = function(src) {
  return this.playlistEl.querySelector('li[data-src="' + src + '"]');
};

Player.prototype.getSecondsByClickPosition = function(element, clickXPosition) {
  var timelineRect = element.getBoundingClientRect();
  var timelineOffset = timelineRect.left;
  var timelineWidth = element.offsetWidth;
  var positionInElement = clickXPosition - timelineOffset;
  var percent = positionInElement / timelineWidth;
  var time = this.audioEl.duration * percent;
  var seconds = Number(time.toFixed());

  return seconds;
};

Player.prototype.seekTime = function(seconds) {
  this.audioEl.currentTime = seconds;
};

Player.prototype.skipForward = function(seconds) {
  this.audioEl.currentTime = this.audioEl.currentTime + seconds;
};

Player.prototype.skipBack = function(seconds) {
  this.audioEl.currentTime = this.audioEl.currentTime - seconds;
};

Player.prototype.getVolumeByHorizClickPosition = function(
  element,
  clickXPosition
) {
  var volumeBarRect = element.getBoundingClientRect();
  var volumeBarOffset = volumeBarRect.left + window.pageXOffset;
  var volumeBarWidth = element.offsetWidth;
  var positionInElement = clickXPosition - volumeBarOffset;
  var percent = positionInElement / volumeBarWidth;
  var volume = Number(percent.toFixed(2));

  return volume;
};

Player.prototype.getVolumeByVertClickPosition = function(
  element,
  clickYPosition
) {
  var volumeBarRect = element.getBoundingClientRect();
  var volumeBarOffset = volumeBarRect.top + window.pageYOffset;
  var volumeBarHeight = element.offsetHeight;
  var positionInElement = clickYPosition - volumeBarOffset;
  var positionFromBottom = volumeBarHeight - positionInElement;
  var percent = positionFromBottom / volumeBarHeight;
  var volume = Number(percent.toFixed(2));

  return volume;
};

Player.prototype.getCurrentPlaylistItem = function() {
  var srcString = this.el.getAttribute('data-src');
  var items = Array.prototype.filter.call(this.playlist.itemEls, function(el) {
    return el.matches('[data-src="' + srcString + '"]');
  });
  var itemEl = items[0];
  return itemEl;
};

Player.prototype.getNextPlaylistSrc = function() {
  var itemEl = this.getCurrentPlaylistItem();
  return itemEl.getAttribute('data-next');
};

Player.prototype.changeVolume = function(volume) {
  this.audioEl.volume = volume;
};

Player.prototype.muteAudio = function() {
  this.storedVolume = this.audioEl.volume;

  this.displayMutedState();
  this.changeVolume(0);
};

Player.prototype.unmuteAudio = function() {
  this.displayUnmutedState();
  if (this.storedVolume) {
    this.changeVolume(this.storedVolume);
  } else {
    this.changeVolume(1);
  }
};

// Displays the length of the audio file
Player.prototype.displayDuration = function() {
  // Exit if no duration element in DOM
  if (!this.durationEl) return;

  var duration;

  if (this.audioEl.duration !== Infinity) {
    duration = toFormatted(this.audioEl.duration);
    this.durationEl.innerHTML = duration;
  }
};

// Changes the current time numbers while playing
Player.prototype.displayCurrentTime = function() {
  // Exit if current time element isn't in DOM
  if (!this.currentTimeEl) return;

  var currentTime = toFormatted(this.audioEl.currentTime);
  this.currentTimeEl.innerHTML = currentTime;
  if (this.audioEl.duration === Infinity) {
    return;
  } else {
    this.updateTimelineProgress();
  }

  return this;
};

// Modifies timeline length based on progress
Player.prototype.updateTimelineProgress = function() {
  // Exit if there is no timeline in DOM
  if (!this.timelineEl) return;

  var progress = (this.audioEl.currentTime / this.audioEl.duration) * 100;
  this.timelineProgressEl.style.width = progress + '%';
};

// Show the portions of the file that have been downloaded
// (i.e. 'buffered') on the timeline
Player.prototype.displayTimeRanges = function() {
  // Exit if there is no timeline element
  if (!this.timelineBufferedEl) return;
  // Exit if audio isn't playing
  if (this.isPlaying !== true) return;
  // Exit if live audio is playing
  if (this.audioEl.duration === Infinity) return;

  for (var i = 0; i < this.audioEl.buffered.length; i++) {
    var currentBuffer = i;

    if (this.audioEl.buffered.start(currentBuffer) < this.audioEl.currentTime) {
      var startX = this.audioEl.buffered.start(currentBuffer);
      var endX = this.audioEl.buffered.end(currentBuffer);
      var posXPercent = (startX / this.audioEl.duration) * 100;
      var widthPercent = ((endX - startX) / this.audioEl.duration) * 100;
      var timeRangeEls = this.timelineBufferedEl.children;

      if (timeRangeEls[currentBuffer]) {
        timeRangeEls[currentBuffer].style.left = posXPercent + '%';
        timeRangeEls[currentBuffer].style.width = widthPercent + '%';
      } else {
        this.timelineBufferedEl.appendChild(document.createElement('div'));
        timeRangeEls[currentBuffer].style.left = posXPercent + '%';
        timeRangeEls[currentBuffer].style.width = widthPercent + '%';
      }
    }
  }
};

// Modifies the play/pause button state
Player.prototype.displayPlayedState = function() {
  this.el.classList.remove(PAUSED_CLASS);
  this.el.classList.add(PLAYING_CLASS);

  if (this.hasPlaylist === true) {
    this.playlist.displayPlayedState(this.getCurrentPlaylistItem());
  }
};

// Modifies the play/pause button state
Player.prototype.displayPausedState = function() {
  this.el.classList.remove(PLAYING_CLASS);
  this.el.classList.add(PAUSED_CLASS);

  if (this.hasPlaylist === true) {
    this.playlist.displayPausedState(this.getCurrentPlaylistItem());
  }
};

// Modifies the timeline
Player.prototype.displayPlayingState = function() {
  this.removeBufferingState();

  if (this.hasPlaylist === true) {
    this.playlist.displayPlayingState(this.getCurrentPlaylistItem());
  }
};

// Modifies the timeline, button displays paused state
Player.prototype.displayStoppedState = function() {
  this.el.classList.remove(PLAYING_CLASS);
  this.el.classList.remove(PAUSED_CLASS);
  this.removeBufferingState();

  if (this.hasPlaylist === true) {
    this.playlist.removeDisplayStates();
  }
};

// Adds buffering styles to timeline
Player.prototype.displayBufferingState = function() {
  this.el.classList.add(LOADING_CLASS);

  if (this.hasPlaylist === true) {
    this.playlist.displayBufferingState(this.getCurrentPlaylistItem());
  }
};

// Removes buffering styles from timeline
Player.prototype.removeBufferingState = function() {
  this.el.classList.remove(LOADING_CLASS);

  if (this.hasPlaylist === true) {
    this.playlist.removeBufferingState(this.getCurrentPlaylistItem());
  }
};

Player.prototype.displayCurrentVolume = function() {
  if (!this.volumeBarEl) return;

  var volumePercent = this.audioEl.volume * 100;

  if (this.audioEl.volume === 0) {
    this.displayMutedState();
  } else {
    this.displayUnmutedState();
  }

  if (this.volumeBarEl.getAttribute('data-volume-direction') === 'h') {
    this.currentVolumeEl.style.width = volumePercent + '%';
  } else {
    this.currentVolumeEl.style.height = volumePercent + '%';
  }

  return this;
};

Player.prototype.displayMutedState = function() {
  this.el.classList.add(MUTED_CLASS);
};

Player.prototype.displayUnmutedState = function() {
  this.el.classList.remove(MUTED_CLASS);
};

export default Player;
