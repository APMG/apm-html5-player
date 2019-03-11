(function() {
  'use strict';

  // Constants
  var PLAYING_CLASS = 'is-playing';
  var PAUSED_CLASS = 'is-paused';
  var LOADING_CLASS = 'is-loading';
  var MUTED_CLASS = 'is-muted';

  // Allows jquery to be passed in through the constructor and scoped properly for normal usage
  var $;

  // Constructor
  var Player = function(jqueryLocal, $el, formatTime, Playlist) {
    // Set $ to passed-in jquery
    $ = jqueryLocal;

    // The containing DOM element
    this.$el = $el;

    // formatTime helper class
    this.formatTime = formatTime;

    //Playlist class
    this.Playlist = Playlist;

    // The playing/paused state of the Player
    this.isPlaying = false;

    // The src that will be used for audio
    this.src = this.$el.data('src');

    // A variable to store the previous volume the player was set at.
    this.storedVolume = 1;

    // References to the playlist
    this.playlistSelector = this.$el.data('playlist');
    this.$playlistElement = $(this.playlistSelector);
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
    .bindEventHandlers()
    .initTime()
    .displayCurrentVolume();

    return this;
  };

  // Descendant elements of the containing DOM element
  Player.prototype.selectElements = function() {
    this.audio = this.$el.find('audio')[0];
    // Controls
    this.$playButton = this.$el.find('.js-player-play');
    this.$skipForwardButton = this.$el.find('[data-skip-forward]');
    this.$skipBackButton = this.$el.find('[data-skip-back]');
    this.$visualPlayButton = this.$playButton.find('#apm_player_play');
    this.$visualPauseButton = this.$playButton.find('#apm_player_pause');
    this.$timeline = this.$el.find('.js-player-timeline');
    this.$timelineProgress = this.$timeline.find('.js-player-progress');
    this.$timelineBuffered = this.$timeline.find('.js-player-buffered');
    this.$volumeBar = this.$el.find('.js-player-volume');
    this.$currentVolume = this.$volumeBar.find('.js-player-volume-current');
    this.$muteButton = this.$el.find('.js-player-mute');
    // Info
    this.$time = this.$el.find('.js-player-time');
    this.$duration = this.$el.find('.js-player-duration');
    this.$currentTime = this.$el.find('.js-player-currentTime');
    this.$title = this.$el.find('.js-player-title');
    this.$artist = this.$el.find('.js-player-artist');

    return this;
  };

  // Setup and bind event handlers
  Player.prototype.bindEventHandlers = function() {
    // Jquery events
    this.$playButton.on('click', this.onPlayClick.bind(this));
    this.$skipForwardButton.on('click', this.onSkipForwardClick.bind(this));
    this.$skipBackButton.on('click', this.onSkipBackClick.bind(this));
    this.$timeline.on('click', this.onTimelineClick.bind(this));
    this.$volumeBar.on('click', this.onVolumeClick.bind(this));
    this.$muteButton.on('click', this.onMuteClick.bind(this));

    // Native javascript events
    this.audio.addEventListener('play', this.onAudioPlay.bind(this));
    this.audio.addEventListener('pause', this.onAudioPause.bind(this));
    this.audio.addEventListener('timeupdate', this.onAudioTimeupdate.bind(this));
    this.audio.addEventListener('waiting', this.onAudioWaiting.bind(this));
    this.audio.addEventListener('playing', this.onAudioPlaying.bind(this));
    this.audio.addEventListener('ended', this.onAudioEnded.bind(this));
    this.audio.addEventListener('volumechange', this.onVolumeChange.bind(this));
    this.audio.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
    this.audio.addEventListener('progress', this.onProgress.bind(this));

    return this;
  };

  Player.prototype.initTime = function() {
    this.displayCurrentTime();
    return this;
  };

  Player.prototype.initPlaylist = function() {
    if (this.$playlistElement.length) {
      this.playlist = new this.Playlist(this);
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

    if (this.isPlaying === false) {
      if (this.audio.readyState === 0) {
        this.loadAudioFromSrc(this.src);
      }
      this.playAudio();
    } else {
      this.pauseAudio();
      if (this.audio.duration === Infinity) {
        this.unloadAudio();
      }
    }
  };

  Player.prototype.onSkipForwardClick = function(e) {
    var $target = $(e.currentTarget);
    var seconds = $target.data('skip-forward');

    e.preventDefault();

    if (this.audio.duration === Infinity) {
      return;
    }

    this.skipForward(seconds);
  };

  Player.prototype.onSkipBackClick = function(e) {
    var $target = $(e.currentTarget);
    var seconds = $target.data('skip-back');

    e.preventDefault();

    if (this.audio.duration === Infinity) {
      return;
    }

    this.skipBack(seconds);
  };

  Player.prototype.onTimelineClick = function(e) {
    var $target = $(e.currentTarget);
    var clickXPosition = e.pageX;
    var seconds = this.getSecondsByClickPosition($target, clickXPosition);

    e.preventDefault(e);

    this.seekTime(seconds);
  };

  Player.prototype.onVolumeClick = function(e) {
    var $target = $(e.currentTarget);
    var volume;

    if ($target.data('volume-direction') === 'h') {
      var clickXPosition = e.pageX;
      volume = this.getVolumeByHorizClickPosition($target, clickXPosition);
    } else {
      var clickYPosition = e.pageY;
      volume = this.getVolumeByVertClickPosition($target, clickYPosition);
    }

    e.preventDefault();

    this.changeVolume(volume);
  };

  Player.prototype.onMuteClick = function(e) {
    e.preventDefault();

    if (this.audio.volume !== 0) {
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
    this.sendToNielsen('setPlayheadPosition', (Date.now()/1000));
  };

  // HTMLMediaElement 'waiting' event fires when audio is downloading
  // or interrupted, such as when buffering at first play
  Player.prototype.onAudioWaiting  = function() {
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
  // Helpers
  // -----------------------------

  Player.prototype.loadAudioFromSrc = function(src) {
    this.audio.src = src;
  };

  Player.prototype.sendToNielsen = function(key, value) {
    if (window.nSdkInstance && this.audio.duration === Infinity) {
      window.nSdkInstance.ggPM(key, value);
    }
  };

  Player.prototype.unloadAudio = function() {
    this.isPlaying = false;
    this.audio.src = '';
    this.displayStoppedState();
    this.sendToNielsen('stop', (Date.now()/1000));
  };

  Player.prototype.playAudio = function() {
    this.pauseAllAudio();
    this.audio.play();
  };

  Player.prototype.pauseAudio = function(currentAudio) {
    if (typeof(currentAudio) !== 'undefined') {
      currentAudio.pause();
    } else {
      this.audio.pause();
    }
  };

  Player.prototype.pauseAllAudio = function() {
    // Pause any audio that may already be playing on the page.
    var self = this;
    $('audio').each(function() {
      self.pauseAudio(this);
    });
  };

  Player.prototype.playNext = function() {
    var nextSrc = this.getNextPlaylistSrc();
    var $nextItem;

    if (typeof(nextSrc) === 'undefined') return;
    $nextItem = this.findNext(nextSrc);
    this.playlist.populatePlayerInfo($nextItem.data('title'), $nextItem.data('artist'));
    this.loadAudioFromSrc(nextSrc);
    this.playAudio();
  };

  Player.prototype.findNext = function(src) {
    return $("li[data-src='" + src +"']");
  };

  Player.prototype.getSecondsByClickPosition = function($element, clickXPosition) {
    var timelineOffset = $element.offset().left;
    var timelineWidth = $element.width();
    var positionInElement = clickXPosition - timelineOffset;
    var percent = positionInElement / timelineWidth;
    var time = this.audio.duration * percent;
    var seconds = Number(time.toFixed());

    return seconds;
  };

  Player.prototype.seekTime = function(seconds) {
    this.audio.currentTime = seconds;
  };

  Player.prototype.skipForward = function(seconds) {
    this.audio.currentTime = this.audio.currentTime + seconds;
  };

  Player.prototype.skipBack = function(seconds) {
    this.audio.currentTime = this.audio.currentTime - seconds;
  };

  Player.prototype.getVolumeByHorizClickPosition = function($element, clickXPosition) {
    var volumeBarOffset = $element.offset().left;
    var volumeBarWidth = $element.width();
    var positionInElement = clickXPosition - volumeBarOffset;
    var percent = positionInElement / volumeBarWidth;
    var volume = Number(percent.toFixed(2));

    return volume;
  };

  Player.prototype.getVolumeByVertClickPosition = function($element, clickYPosition) {
    var volumeBarOffset = $element.offset().top;
    var volumeBarHeight = $element.outerHeight();
    var positionInElement = clickYPosition - volumeBarOffset;
    var positionFromBottom = volumeBarHeight - positionInElement;
    var percent = positionFromBottom / volumeBarHeight;
    var volume = Number(percent.toFixed(2));

    return volume;
  };

  Player.prototype.getPlaylistItem = function() {
    var $item = this.playlist.$items.filter($('[data-src="' + $(this.audio).attr('src') + '"]'));
    return $item;
  };

  Player.prototype.getNextPlaylistSrc = function() {
    var $item = this.playlist.$items.filter($('[data-src="' + $(this.audio).attr('src') + '"]'));
    return $item.data('next');
  };

  Player.prototype.changeVolume = function(volume) {
    this.audio.volume = volume;
  };

  Player.prototype.muteAudio = function() {
    this.storedVolume = this.audio.volume;

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

    if (this.audio.duration !== Infinity) {
      duration = this.formatTime.toFormatted(this.audio.duration);
      this.$duration.html(duration);
    }
  };

  // Changes the current time numbers while playing
  Player.prototype.displayCurrentTime = function() {
    var currentTime = this.formatTime.toFormatted(this.audio.currentTime);
    this.$currentTime.html(currentTime);
    if (this.audio.duration === Infinity) {
      return;
    } else {
      this.updateTimelineProgress();
    }

    return this;
  };

  // Modifies timeline length based on progress
  Player.prototype.updateTimelineProgress = function() {
    var progress = (this.audio.currentTime / this.audio.duration) * 100;
    this.$timelineProgress.css('width', progress + '%');
  };

  // Show the portions of the file that have been downloaded
  // (i.e. 'buffered') on the timeline
  Player.prototype.displayTimeRanges = function() {
    if (this.isPlaying !== true) { return; }
    if (this.audio.duration === Infinity) { return; }

    for (var i = 0; i < this.audio.buffered.length; i++) {
      var currentBuffer = this.audio.buffered.length - 1 - i;

      if (this.audio.buffered.start(currentBuffer) < this.audio.currentTime) {
        var startX = this.audio.buffered.start(currentBuffer);
        var endX = this.audio.buffered.end(currentBuffer);
        var posXPercent = (startX / this.audio.duration) * 100;
        var widthPercent = (((endX - startX) / this.audio.duration) * 100);
        var $timeRanges = this.$timelineBuffered.children();
        var timeRangeCss = {
          'left': posXPercent + '%',
          'width': widthPercent + '%'
        };

        if ($timeRanges.eq(currentBuffer).length) {
          $timeRanges.eq(currentBuffer).css(timeRangeCss);
        } else {
          this.$timelineBuffered.append('<div></div>');
          $timeRanges.eq(currentBuffer).css(timeRangeCss);
        }
      }
    }
  };

  // Modifies the play/pause button state
  Player.prototype.displayPlayedState = function() {
    this.$el.removeClass(PAUSED_CLASS);
    this.$el.addClass(PLAYING_CLASS);

    if (this.hasPlaylist === true) {
      this.playlist.displayPlayedState(this.getPlaylistItem());
    }
  };

  // Modifies the play/pause button state
  Player.prototype.displayPausedState = function() {
    this.$el.removeClass(PLAYING_CLASS);
    this.$el.addClass(PAUSED_CLASS);

    if (this.hasPlaylist === true) {
      this.playlist.displayPausedState(this.getPlaylistItem());
    }
  };

  // Modifies the timeline
  Player.prototype.displayPlayingState = function() {
    this.removeBufferingState();

    if (this.hasPlaylist === true) {
      this.playlist.displayPlayingState(this.getPlaylistItem());
    }
  };

  // Modifies the timeline, button displays paused state
  Player.prototype.displayStoppedState = function() {
    this.$el.removeClass(PLAYING_CLASS);
    this.$el.removeClass(PAUSED_CLASS);
    this.removeBufferingState();

    if (this.hasPlaylist === true) {
      this.playlist.removeDisplayStates();
    }
  };

  // Adds buffering styles to timeline
  Player.prototype.displayBufferingState = function() {
    this.$el.addClass(LOADING_CLASS);

    if (this.hasPlaylist === true) {
      this.playlist.displayBufferingState(this.getPlaylistItem());
    }
  };

  // Removes buffering styles from timeline
  Player.prototype.removeBufferingState = function() {
    this.$el.removeClass(LOADING_CLASS);

    if (this.hasPlaylist === true) {
      this.playlist.removeBufferingState(this.getPlaylistItem());
    }
  };

  Player.prototype.displayCurrentVolume = function() {
    var volumePercent = this.audio.volume * 100;

    if (this.audio.volume === 0) {
      this.displayMutedState();
    } else {
      this.displayUnmutedState();
    }

    if (this.$volumeBar.data('volume-direction') === 'h') {
      this.$currentVolume.css('width', volumePercent + '%');
    } else {
      this.$currentVolume.css('height', volumePercent + '%');
    }

    return this;
  };

  Player.prototype.displayMutedState = function() {
    this.$el.addClass(MUTED_CLASS);
  };

  Player.prototype.displayUnmutedState = function() {
    this.$el.removeClass(MUTED_CLASS);
  };

  if (typeof define === 'function' && define.amd) {
    define(function() {
      return Player;
    });
  }
  else {
    window.Player = Player;
  }
}());