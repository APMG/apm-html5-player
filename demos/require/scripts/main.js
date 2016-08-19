requirejs.config({
  baseUrl: './',
  paths: {
    jquery: 'bower_components/jquery/dist/jquery.min',
    formattime: '../../../script/FormatTime',
    playlist: '../../../script/Playlist',
    player: '../../../script/Player'
  }
});

requirejs(['jquery', 'player'], function($, Player){
  if ($('.js-player').length) {
    var player = Player.init($, $('.js-player'));
  }
});
