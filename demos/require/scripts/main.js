requirejs.config({
  baseUrl: './',
  paths: {
    jquery: 'bower_components/jquery/dist/jquery.min',
    formattime: '../../../script/FormatTime',
    playlist: '../../../script/Playlist',
    player: '../../../script/Player',
    test: '../../../script/test'
  }
});
requirejs(['jquery', 'player','formattime', 'playlist'],
  function($, Player, FormatTime, Playlist){
    var formatTime = new FormatTime();
    if ($('.js-player').length) {
      var player = new Player($, $('.js-player'), formatTime, Playlist);
      player.init();
    }
  }
);
