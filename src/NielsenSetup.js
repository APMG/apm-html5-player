(function() {
  "use strict";

  var NielsenSetup = function() {};

  NielsenSetup.prototype.init = function(params, metadata) {
    window.nielsenMetadataObject = metadata;
    window.nSdkInstance = window.NOLCMB.getInstance(params);
    window.nSdkInstance.ggInitialize(params);
  };

  if (typeof define === "function" && define.amd) {
    define(function() {
      return new NielsenSetup();
    });
  } else {
    window.NielsenSetup = new NielsenSetup();
  }
})();
