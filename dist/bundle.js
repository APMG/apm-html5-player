(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.ApmPlayer = {}));
}(this, function (exports) { 'use strict';

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

  var Playlist = function(parent) {
    this.player = parent;
    this.el = this.player.playlistEl;
  };
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

  var PLAYING_CLASS = 'is-playing';
  var PAUSED_CLASS = 'is-paused';
  var LOADING_CLASS = 'is-loading';
  var MUTED_CLASS = 'is-muted';
  var Player = function (el, options) {
    this.el = el;
    this.options = options;
    this.isPlaying = false;
    this.storedVolume = 1;
    this.playlistSelector = this.el.getAttribute('data-playlist');
    this.playlistEl = document.querySelector(this.playlistSelector);
    this.playlist;
    this.hasPlaylist = false;
  };
  Player.prototype.init = function () {
    this.selectElements()
      .initPlaylist()
      .getSources()
      .bindEventHandlers()
      .initTime()
      .displayCurrentVolume();
    return this;
  };
  Player.prototype.selectElements = function () {
    this.audioEl = this.el.querySelector('audio');
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
    this.durationEl = this.el.querySelector('.js-player-duration');
    this.currentTimeEl = this.el.querySelector('.js-player-currentTime');
    this.titleEl = this.el.querySelector('.js-player-title');
    this.artistEl = this.el.querySelector('.js-player-artist');
    return this;
  };
  Player.prototype.getSources = function () {
    try {
      this.sources = JSON.parse(
        decodeURI(this.el.getAttribute('data-src')).replace(/'/g, '"')
      );
    } catch (e) {
      if (typeof console !== 'undefined') {
        var syntaxReg = /^\s*SyntaxError: Unexpected token|^\s*SyntaxError: Unexpected end of JSON input/;
        if (!syntaxReg.test(e)) {
          console.log(e);
        }
      }
      this.sources = this.el.getAttribute('data-src');
    }
    return this;
  };
  Player.prototype.bindEventHandlers = function () {
    var self = this;
    Array.prototype.forEach.call(this.playButtonEls, function (el) {
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
  Player.prototype.initTime = function () {
    this.displayCurrentTime();
    return this;
  };
  Player.prototype.initPlaylist = function () {
    if (this.playlistEl) {
      this.playlist = new Playlist(this);
      this.playlist.init();
      this.hasPlaylist = true;
    }
    return this;
  };
  Player.prototype.onPlayClick = function (e) {
    e.preventDefault();
    this.handlePlay();
  };
  Player.prototype.handlePlay = function () {
    if (this.isPlaying === false) {
      if (this.audioEl.readyState === 0) {
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
  Player.prototype.onSkipForwardClick = function (e) {
    var targetEl = e.currentTarget;
    var seconds = targetEl.getAttribute('data-skip-forward');
    e.preventDefault();
    if (this.audioEl.duration === Infinity) {
      return;
    }
    this.skipForward(seconds);
  };
  Player.prototype.onSkipBackClick = function (e) {
    var targetEl = e.currentTarget;
    var seconds = targetEl.getAttribute('data-skip-back');
    e.preventDefault();
    if (this.audioEl.duration === Infinity) {
      return;
    }
    this.skipBack(seconds);
  };
  Player.prototype.onTimelineClick = function (e) {
    var targetEl = e.currentTarget;
    var clickXPosition = e.pageX;
    var seconds = this.getSecondsByClickPosition(targetEl, clickXPosition);
    e.preventDefault(e);
    this.seekTime(seconds);
  };
  Player.prototype.onVolumeClick = function (e) {
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
  Player.prototype.onMuteClick = function (e) {
    e.preventDefault();
    if (this.audioEl.volume !== 0) {
      this.muteAudio();
    } else {
      this.unmuteAudio();
    }
  };
  Player.prototype.onAudioPlay = function () {
    this.isPlaying = true;
    this.displayPlayedState();
  };
  Player.prototype.onAudioPause = function () {
    this.isPlaying = false;
    this.displayPausedState();
  };
  Player.prototype.onAudioTimeupdate = function () {
    this.displayCurrentTime();
    this.sendToNielsen('setPlayheadPosition', Date.now() / 1000);
  };
  Player.prototype.onAudioWaiting = function () {
    this.displayBufferingState();
  };
  Player.prototype.onAudioPlaying = function () {
    this.displayPlayingState();
  };
  Player.prototype.onAudioEnded = function () {
    this.displayStoppedState();
    if (this.hasPlaylist === true) {
      this.playNext();
    }
  };
  Player.prototype.onVolumeChange = function () {
    this.displayCurrentVolume();
  };
  Player.prototype.onLoadedMetadata = function () {
    this.displayDuration();
    this.sendToNielsen('loadMetadata', window.nielsenMetadataObject);
  };
  Player.prototype.onProgress = function () {
    this.displayTimeRanges();
  };
  Player.prototype.loadAudioFromSources = function (sources) {
    this.audioEl.removeAttribute('src');
    this.audioEl.innerHTML = '';
    if (typeof sources === 'string') {
      sources = sources.split();
    }
    this.createSourceEls(sources);
    this.audioEl.load();
  };
  Player.prototype.createSourceEls = function (sources) {
    var self = this;
    sources.forEach(function (source) {
      var sourceUrl;
      var sourceType;
      if (typeof source === 'object' && !Array.isArray(source)) {
        sourceUrl = source.url;
        sourceType = source.type;
      } else {
        sourceUrl = source;
        sourceType = self.getSourceType(source);
      }
      var sourceEl = document.createElement('source');
      sourceEl.setAttribute('src', sourceUrl);
      if (sourceType !== null) {
        sourceEl.setAttribute('type', sourceType);
      }
      self.audioEl.appendChild(sourceEl);
    });
  };
  Player.prototype.getSourceType = function (source) {
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
  Player.prototype.sendToNielsen = function (key, value) {
    if (window.nSdkInstance && this.audioEl.duration === Infinity) {
      window.nSdkInstance.ggPM(key, value);
    }
  };
  Player.prototype.unloadAudio = function () {
    this.isPlaying = false;
    this.audioEl.innerHTML = '';
    this.audioEl.load();
    this.displayStoppedState();
    this.sendToNielsen('stop', Date.now() / 1000);
  };
  Player.prototype.playAudio = function () {
    this.pauseAllAudio();
    this.audioEl.play();
  };
  Player.prototype.pauseAudio = function (currentAudio) {
    if (typeof currentAudio !== 'undefined') {
      currentAudio.pause();
    } else {
      this.audioEl.pause();
    }
  };
  Player.prototype.pauseAllAudio = function () {
    var self = this;
    var audioEls = document.querySelectorAll('audio');
    Array.prototype.forEach.call(audioEls, function (el) {
      self.pauseAudio(el);
    });
  };
  Player.prototype.playNext = function () {
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
  Player.prototype.findNext = function (src) {
    return this.playlistEl.querySelector('li[data-src="' + src + '"]');
  };
  Player.prototype.getSecondsByClickPosition = function (
    element,
    clickXPosition
  ) {
    var timelineRect = element.getBoundingClientRect();
    var timelineOffset = timelineRect.left;
    var timelineWidth = element.offsetWidth;
    var positionInElement = clickXPosition - timelineOffset;
    var percent = positionInElement / timelineWidth;
    var time = this.audioEl.duration * percent;
    var seconds = Number(time.toFixed());
    return seconds;
  };
  Player.prototype.seekTime = function (seconds) {
    this.audioEl.currentTime = seconds;
  };
  Player.prototype.skipForward = function (seconds) {
    this.audioEl.currentTime = this.audioEl.currentTime + Number(seconds);
  };
  Player.prototype.skipBack = function (seconds) {
    this.audioEl.currentTime = this.audioEl.currentTime - Number(seconds);
  };
  Player.prototype.getVolumeByHorizClickPosition = function (
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
  Player.prototype.getVolumeByVertClickPosition = function (
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
  Player.prototype.getCurrentPlaylistItem = function () {
    var srcString = this.el.getAttribute('data-src');
    var items = Array.prototype.filter.call(this.playlist.itemEls, function (el) {
      return el.matches('[data-src="' + srcString + '"]');
    });
    var itemEl = items[0];
    return itemEl;
  };
  Player.prototype.getNextPlaylistSrc = function () {
    var itemEl = this.getCurrentPlaylistItem();
    return itemEl.getAttribute('data-next');
  };
  Player.prototype.changeVolume = function (volume) {
    this.audioEl.volume = volume;
  };
  Player.prototype.muteAudio = function () {
    this.storedVolume = this.audioEl.volume;
    this.displayMutedState();
    this.changeVolume(0);
  };
  Player.prototype.unmuteAudio = function () {
    this.displayUnmutedState();
    if (this.storedVolume) {
      this.changeVolume(this.storedVolume);
    } else {
      this.changeVolume(1);
    }
  };
  Player.prototype.displayDuration = function () {
    if (!this.durationEl) return;
    var duration;
    if (this.audioEl.duration !== Infinity) {
      duration = toFormatted(this.audioEl.duration);
      this.durationEl.innerHTML = duration;
    }
  };
  Player.prototype.displayCurrentTime = function () {
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
  Player.prototype.updateTimelineProgress = function () {
    if (!this.timelineEl) return;
    var progress = (this.audioEl.currentTime / this.audioEl.duration) * 100;
    this.timelineProgressEl.style.width = progress + '%';
  };
  Player.prototype.displayTimeRanges = function () {
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
  Player.prototype.displayPlayedState = function () {
    this.el.classList.remove(PAUSED_CLASS);
    this.el.classList.add(PLAYING_CLASS);
    if (this.hasPlaylist === true) {
      this.playlist.displayPlayedState(this.getCurrentPlaylistItem());
    }
  };
  Player.prototype.displayPausedState = function () {
    this.el.classList.remove(PLAYING_CLASS);
    this.el.classList.add(PAUSED_CLASS);
    if (this.hasPlaylist === true) {
      this.playlist.displayPausedState(this.getCurrentPlaylistItem());
    }
  };
  Player.prototype.displayPlayingState = function () {
    this.removeBufferingState();
    if (this.hasPlaylist === true) {
      this.playlist.displayPlayingState(this.getCurrentPlaylistItem());
    }
  };
  Player.prototype.displayStoppedState = function () {
    this.el.classList.remove(PLAYING_CLASS);
    this.el.classList.remove(PAUSED_CLASS);
    this.removeBufferingState();
    if (this.hasPlaylist === true) {
      this.playlist.removeDisplayStates();
    }
  };
  Player.prototype.displayBufferingState = function () {
    this.el.classList.add(LOADING_CLASS);
    if (this.hasPlaylist === true) {
      this.playlist.displayBufferingState(this.getCurrentPlaylistItem());
    }
  };
  Player.prototype.removeBufferingState = function () {
    this.el.classList.remove(LOADING_CLASS);
    if (this.hasPlaylist === true) {
      this.playlist.removeBufferingState(this.getCurrentPlaylistItem());
    }
  };
  Player.prototype.displayCurrentVolume = function () {
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
  Player.prototype.displayMutedState = function () {
    this.el.classList.add(MUTED_CLASS);
  };
  Player.prototype.displayUnmutedState = function () {
    this.el.classList.remove(MUTED_CLASS);
  };

  var NielsenSetup = function() {};
  NielsenSetup.prototype.init = function(params, metadata) {
    window.nielsenMetadataObject = metadata;
    window.nSdkInstance = window.NOLCMB.getInstance(params);
    window.nSdkInstance.ggInitialize(params);
  };

  function HTML5PlayerGoogleAnalytics(args) {
    var self = this;
    this.ga_version = 'universal';
    this.isFirstPlay = true;
    this.lastsrc = '';
    this.quartile = 0;
    function checkSources() {
      self.isFirstPlay = self.audioele.currentSrc === self.lastsrc ? false : true;
      self.lastsrc = self.audioele.currentSrc;
    }
    function getCategory() {
      var cat;
      if (self.audioele.currentSrc.indexOf('stream.publicradio.org') > -1) {
        cat = 'Live Audio';
      } else {
        cat = 'On-Demand Audio';
      }
      return cat;
    }
    function audioSrcForReporting() {
      return self.audioele.currentSrc.replace(
        'http://play.publicradio.org/api-2.0.1/o',
        ''
      );
    }
    function percent_played() {
      return self.audioele.currentTime / self.audioele.duration;
    }
    function onPositionUpdate() {
      if (self.audioele.duration === Infinity) {
        return;
      }
      var category = getCategory();
      var src = audioSrcForReporting();
      var percent = percent_played();
      var quartile = Math.floor((percent + 0.02) * 4);
      if (quartile > self.quartile && percent > 0 && percent !== 1) {
        self.quartile = quartile;
        if (quartile <= 3) {
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
      trackEvent({ category: category, action: 'FINISHED', label: src });
      self.isFirstPlay = true;
    }
    function onPlayPause() {
      var category = getCategory(),
        src = audioSrcForReporting();
      checkSources();
      if (self.isFirstPlay === true) {
        trackEvent({ category: category, action: 'START', label: src });
      }
    }
    function trackEvent(event) {
      if (typeof window.ga === 'undefined') {
        return;
      }
      if (typeof event !== 'object') {
        console.error('object expected');
        return;
      }
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
      if (typeof args.audio === 'undefined') {
        console.error('Audio element must be passed in');
      }
      if (typeof args.version !== 'undefined') {
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

  Object.defineProperty(exports, '__esModule', { value: true });

}));
