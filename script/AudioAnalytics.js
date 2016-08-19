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
(function(){

  'use strict';

  function HTML5PlayerGoogleAnalytics(args){

    var self = this;

    /* Default to Google Analytics Universal API */
    this.ga_version = 'universal';
    //@todo  rethink the use of isFirstPlay as a statemachine and make it its own object?
    this.isFirstPlay = true;
    this.lastsrc ='';
    this.quartile = 0;


    function checkSources() {
      self.isFirstPlay = (self.audioele.src === self.lastsrc ? false : true);
      self.lastsrc = self.audioele.src;
    }

    /* Return category 'Live Audio', 'On-Demand Audio' or in rare instances 'Underwriting' */
    function getCategory() {
      var cat;
      if(self.audioele.src.indexOf('stream.publicradio.org') > -1) {
        cat = 'Live Audio';
      }
      else {
        cat = 'On-Demand Audio';
      }
      return cat;
    }

    function audioSrcForReporting() {
      return self.audioele.src.replace('http://play.publicradio.org/api-2.0.1/o', '');
    }

    function percent_played() {
      return self.audioele.currentTime/self.audioele.duration;
    }

    /* Triggered every 100ms with position update data */
    function onPositionUpdate() {
      if(self.audioele.duration === Infinity) {
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
              action: 'QUARTILE-'+quartile,
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
      trackEvent({ category: category, action: 'FINISHED', label: src});
      self.isFirstPlay = true;
    }

    function onPlayPause() {
      var category = getCategory(), src = audioSrcForReporting();

      // Track only the first 'PLAY' event as 'START' (we don't care about 'PAUSE' status)
      if ( self.isFirstPlay === true ) {
        //console.log('About to call with: ' );
        //console.log({ category: category, action: 'START', label: src});
        trackEvent({ category: category, action: 'START', label: src});
      }
      checkSources();
    }

    /* Handle Google Universal or Classic API calls
     * @example trackEvent({ category: 'Live Audio' action: 'START', label: meta.identifier });
     * @example trackEvent({ category: 'On-Demand Audio' action: 'FINISHED', label: meta.identifier });
     */
    function trackEvent(event) {

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

        window.ga('send', 'event', event.category, event.action, event.label, {'nonInteraction': 1});

      } else if (self.ga_version === 'classic') {

        window._gaq.push(['_trackEvent', event.category, event.action, event.label, undefined, true]);

      }

    }

    this.init = function(args) {

      // Set ga_version to 'universal' or 'classic'.
      // Events will be tracked using the proper Javascript API in trackEvent().
      if ( (typeof args.audio) === 'undefined' ) {
        console.error('Audio element must be passed in');
      }
      if( typeof args.version !== 'undefined') {
        // Otherwise use provided argument, whitelisting options 'universal' or 'classic'.
        self.ga_version = (args.version === 'universal' || args.version === 'classic') ? args.version : self.ga_version;
      }

      self.audioele  = args.audio;
      self.audioele.addEventListener('timeupdate', onPositionUpdate);
      self.audioele.addEventListener('ended', onMediaFinished);
      self.audioele.addEventListener('play', onPlayPause);
      self.audioele.addEventListener('pause', onPlayPause);

    };
  }

  if (typeof define === 'function' && define.amd) {
    define(function() {
      return HTML5PlayerGoogleAnalytics;
    });
  } else {
    window.HTML5PlayerGoogleAnalytics = HTML5PlayerGoogleAnalytics;
  }
})();
