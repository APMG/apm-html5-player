(function() {
  var createTest = function($) {
    var Test = function() {
      console.log('Test');
      console.log($.fn.jquery);
    };
    return new Test();
  };
  if (typeof define === 'function' && define.amd) {
    define(['require', 'jquery'], function(require) {
      var $ = require('jquery');
      return {
        init: function() {
          return new createTest($);
        }
      };
    });
  }
}());
