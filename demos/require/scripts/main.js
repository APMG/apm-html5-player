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

requirejs(['jquery', 'player','test'], function($, Player, T){
  //T.init();
  if ($('.js-player').length) {
    Player.init();
  }
});
