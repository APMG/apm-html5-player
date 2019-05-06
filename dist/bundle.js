(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global['apm-html5-player'] = {}));
}(this, function (exports) { 'use strict';

  // Formats an ugly time (in seconds) to a nice readable format
  // e.g. 125 > 2:05, or 4226 > 1:10:26
  function toFormatted(timeInSeconds) {
    timeInSeconds = Math.round(timeInSeconds);

    var formattedTime = '';
    var formattedMinutes = '';
    var formattedSeconds = '';
    var hours = Math.floor(timeInSeconds / 3600);
    var minutes = Math.floor(timeInSeconds / 60 - hours * 60);
    var seconds = timeInSeconds - minutes * 60 - hours * 3600;

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
  }

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

    // The src that will be used for audio
    this.src = this.el.getAttribute('data-src');

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
      // TODO split out playlist
      // .initPlaylist()
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
    this.playButtonEl = this.el.querySelector('.js-player-play');
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
    this.timeEl = this.el.querySelector('.js-player-time');
    this.durationEl = this.el.querySelector('.js-player-duration');
    this.currentTimeEl = this.el.querySelector('.js-player-currentTime');
    this.titleEl = this.el.querySelector('.js-player-title');
    this.artistEl = this.el.querySelector('.js-player-artist');

    return this;
  };

  // Setup and bind event handlers
  Player.prototype.bindEventHandlers = function() {
    // Click events
    this.playButtonEl &&
      this.playButtonEl.addEventListener('click', this.onPlayClick.bind(this));

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

  // TODO: split out playlist
  // Player.prototype.initPlaylist = function() {
  //   if (this.playlistEl.length) {
  //     this.playlist = new Playlist(this);
  //     this.playlist.init();
  //     this.hasPlaylist = true;
  //   }

  //   return this;
  // };

  // -----------------------------
  // Event Handlers
  // -----------------------------

  Player.prototype.onPlayClick = function(e) {
    e.preventDefault();

    if (this.isPlaying === false) {
      if (this.audioEl.readyState === 0) {
        this.loadAudioFromSrc(this.src);
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
    // TODO: split out playlist
    // if (this.hasPlaylist === true) {
    //   this.playNext();
    // }
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

  Player.prototype.loadAudioFromSrc = function(src) {
    this.audioEl.src = src;
  };

  Player.prototype.sendToNielsen = function(key, value) {
    if (window.nSdkInstance && this.audioEl.duration === Infinity) {
      window.nSdkInstance.ggPM(key, value);
    }
  };

  Player.prototype.unloadAudio = function() {
    this.isPlaying = false;
    this.audioEl.src = '';
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

  // TODO: Split out playlist
  // Player.prototype.playNext = function() {
  //   var nextSrc = this.getNextPlaylistSrc();
  //   var nextItemEl;

  //   if (typeof nextSrc === 'undefined') return;
  //   nextItemEl = this.findNext(nextSrc);
  //   this.playlist.populatePlayerInfo(
  //     nextItemEl.getAttribute('data-title'),
  //     nextItemEl.getAttribute('data-artist')
  //   );
  //   this.loadAudioFromSrc(nextSrc);
  //   this.playAudio();
  // };

  // Player.prototype.findNext = function(src) {
  //   return this.playlistEl.querySelector("li[data-src='" + src + "']");
  // };

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
    var volumeBarOffset = volumeBarRect.left;
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
    var volumeBarOffset = volumeBarRect.top + document.scrollTop;
    var volumeBarHeight = element.offsetHeight;
    var positionInElement = clickYPosition - volumeBarOffset;
    var positionFromBottom = volumeBarHeight - positionInElement;
    var percent = positionFromBottom / volumeBarHeight;
    var volume = Number(percent.toFixed(2));

    return volume;
  };

  // TODO: Should probably move all playlist stuff out of here
  //
  // Player.prototype.getPlaylistItem = function() {
  //   var $item = this.playlist.items.filter(
  //     $('[data-src="' + $(this.audio).attr('src') + '"]')
  //   );
  //   return $item;
  // };

  // Player.prototype.getNextPlaylistSrc = function() {
  //   var $item = this.playlist.$items.filter(
  //     $('[data-src="' + $(this.audio).attr('src') + '"]')
  //   );
  //   return $item.data('next');
  // };

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
    var duration;

    if (this.audioEl.duration !== Infinity) {
      duration = toFormatted(this.audioEl.duration);
      this.durationEl.innerHTML = duration;
    }
  };

  // Changes the current time numbers while playing
  Player.prototype.displayCurrentTime = function() {
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
    var progress = (this.audioEl.currentTime / this.audioEl.duration) * 100;
    this.timelineProgressEl.style.width = progress + '%';
  };

  // Show the portions of the file that have been downloaded
  // (i.e. 'buffered') on the timeline
  Player.prototype.displayTimeRanges = function() {
    if (!this.timelineBufferedEl) return;
    if (this.isPlaying !== true) return;
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

    // TODO split out playlist
    // if (this.hasPlaylist === true) {
    //   this.playlist.displayPlayedState(this.getPlaylistItem());
    // }
  };

  // Modifies the play/pause button state
  Player.prototype.displayPausedState = function() {
    this.el.classList.remove(PLAYING_CLASS);
    this.el.classList.add(PAUSED_CLASS);

    // TODO split out playlist
    // if (this.hasPlaylist === true) {
    //   this.playlist.displayPausedState(this.getPlaylistItem());
    // }
  };

  // Modifies the timeline
  Player.prototype.displayPlayingState = function() {
    this.removeBufferingState();

    // TODO split out playlist
    // if (this.hasPlaylist === true) {
    //   this.playlist.displayPlayingState(this.getPlaylistItem());
    // }
  };

  // Modifies the timeline, button displays paused state
  Player.prototype.displayStoppedState = function() {
    this.el.classList.remove(PLAYING_CLASS);
    this.el.classList.remove(PAUSED_CLASS);
    this.removeBufferingState();

    // TODO split out playlist
    // if (this.hasPlaylist === true) {
    //   this.playlist.removeDisplayStates();
    // }
  };

  // Adds buffering styles to timeline
  Player.prototype.displayBufferingState = function() {
    this.el.classList.add(LOADING_CLASS);

    // TODO split out playlist
    // if (this.hasPlaylist === true) {
    //   this.playlist.displayBufferingState(this.getPlaylistItem());
    // }
  };

  // Removes buffering styles from timeline
  Player.prototype.removeBufferingState = function() {
    this.el.classList.remove(LOADING_CLASS);

    // TODO split out playlist
    // if (this.hasPlaylist === true) {
    //   this.playlist.removeBufferingState(this.getPlaylistItem());
    // }
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

  // Required modules for page load

  // Constructor
  // The 'parent' argument passed in is the parent object from Player.js.
  // This script is only intended to be used with that Player.js.
  var Playlist = function(parent) {
    this.player = parent;
    // The containing DOM element
    this.$el = this.player.$playlistElement;
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

      if ($nextItem.length === 0) {
        return;
      }

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

    this.player.loadAudioFromSrc(src);
    this.player.playAudio();
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
    this.player.$title.text(title);
    this.player.$artist.text(artist);
  };

  var NielsenSetup = function() {};

  NielsenSetup.prototype.init = function(params, metadata) {
    window.nielsenMetadataObject = metadata;
    window.nSdkInstance = window.NOLCMB.getInstance(params);
    window.nSdkInstance.ggInitialize(params);
  };

  /*
   * Google Analytics plug-in for HTML5 Player
   *
   * Example Usage:
   * var example_analytics = new HTML5PlayerGoogleAnalytics();
   * example_analytics.init({ version: 'classic' ,  audio: $('#audio') }); // omit 'version' property to default to 'universal'
   * Note Marketplace uses universal anaylics now.
   * Conceptually its probably easiest ot think about this piece of code as something that registers
   * event listeners (start, end and timeupdate) for the HTML5 audio player. Then we send a Google Analytics event on START,
   * FINISH and 25, 50 amd 75% the way through aka Quartiles.
   */

  function HTML5PlayerGoogleAnalytics(args) {
    var self = this;

    /* Default to Google Analytics Universal API */
    this.ga_version = 'universal';
    //@todo  rethink the use of isFirstPlay as a statemachine and make it its own object?
    this.isFirstPlay = true;
    this.lastsrc = '';
    this.quartile = 0;

    function checkSources() {
      self.isFirstPlay = self.audioele.src === self.lastsrc ? false : true;
      self.lastsrc = self.audioele.src;
    }

    /* Return category 'Live Audio', 'On-Demand Audio' or in rare instances 'Underwriting' */
    function getCategory() {
      var cat;
      if (self.audioele.src.indexOf('stream.publicradio.org') > -1) {
        cat = 'Live Audio';
      } else {
        cat = 'On-Demand Audio';
      }
      return cat;
    }

    function audioSrcForReporting() {
      return self.audioele.src.replace(
        'http://play.publicradio.org/api-2.0.1/o',
        ''
      );
    }

    function percent_played() {
      return self.audioele.currentTime / self.audioele.duration;
    }

    /* Triggered every 100ms with position update data */
    function onPositionUpdate() {
      if (self.audioele.duration === Infinity) {
        return; // bail if it is live audio
      }
      var category = getCategory();
      var src = audioSrcForReporting();
      var percent = percent_played();
      var quartile = Math.floor((percent + 0.02) * 4);

      // Track quartiles played for static audio, but not underwriting.
      // Log 'QUARTILE-2', and 'QUARTILE-3', but not 'QUARTILE-1', or 'QUARTILE-4'.
      // We don't need to log QUARTILE-1 because START is the same thing.
      // We don't need to log QUARTILE-4 because FINISHED is the same thing.
      if (quartile > self.quartile && percent > 0 && percent !== 1) {
        self.quartile = quartile;

        if (quartile <= 3) {
          //console.log('About to call with: ' );
          //console.log({ category: category, action: 'QUARTILE-'+quartile, label: src});
          trackEvent({
            category: category,
            action: 'QUARTILE-' + quartile,
            label: src
          });
        }
      }
    }

    function onMediaFinished() {
      var category = getCategory();
      var src = audioSrcForReporting();
      //console.log('About to call with: ' );
      //console.log({ category: category, action: 'FINISHED', label: src});
      trackEvent({ category: category, action: 'FINISHED', label: src });
      self.isFirstPlay = true;
    }

    function onPlayPause() {
      var category = getCategory(),
        src = audioSrcForReporting();

      checkSources();

      // Track only the first 'PLAY' event as 'START' (we don't care about 'PAUSE' status)
      if (self.isFirstPlay === true) {
        //console.log('About to call with: ' );
        //console.log({ category: category, action: 'START', label: src});
        trackEvent({ category: category, action: 'START', label: src });
      }
    }

    /* Handle Google Universal or Classic API calls
     * @example trackEvent({ category: 'Live Audio' action: 'START', label: meta.identifier });
     * @example trackEvent({ category: 'On-Demand Audio' action: 'FINISHED', label: meta.identifier });
     */
    function trackEvent(event) {
      if (typeof window.ga === 'undefined') {
        return; // bail if no google analytics or ad blocker
      }
      // Test that an object was passed
      if (typeof event !== 'object') {
        console.error('object expected');
        return;
      }

      // Test that the object contains required attributes
      if (typeof event.category === 'undefined') {
        console.error('event category expected');
        return;
      }

      if (typeof event.action === 'undefined') {
        console.error('event action expected');
        return;
      }

      if (typeof event.label === 'undefined') {
        console.error('event label expected');
        return;
      }

      if (self.ga_version === 'universal') {
        window.ga('send', 'event', event.category, event.action, event.label, {
          nonInteraction: 1
        });
      } else if (self.ga_version === 'classic') {
        window._gaq.push([
          '_trackEvent',
          event.category,
          event.action,
          event.label,
          undefined,
          true
        ]);
      }
    }

    this.init = function(args) {
      // Set ga_version to 'universal' or 'classic'.
      // Events will be tracked using the proper Javascript API in trackEvent().
      if (typeof args.audio === 'undefined') {
        console.error('Audio element must be passed in');
      }
      if (typeof args.version !== 'undefined') {
        // Otherwise use provided argument, whitelisting options 'universal' or 'classic'.
        self.ga_version =
          args.version === 'universal' || args.version === 'classic'
            ? args.version
            : self.ga_version;
      }

      self.audioele = args.audio;
      self.audioele.addEventListener('timeupdate', onPositionUpdate);
      self.audioele.addEventListener('ended', onMediaFinished);
      self.audioele.addEventListener('play', onPlayPause);
      self.audioele.addEventListener('pause', onPlayPause);
    };
  }

  exports.AudioAnalytics = HTML5PlayerGoogleAnalytics;
  exports.NielsenSetup = NielsenSetup;
  exports.Player = Player;
  exports.Playlist = Playlist;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
