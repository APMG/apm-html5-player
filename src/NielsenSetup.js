'use strict';

var NielsenSetup = function() {};

NielsenSetup.prototype.init = function(params, metadata) {
  window.nielsenMetadataObject = metadata;
  window.nSdkInstance = window.NOLCMB.getInstance(params);
  window.nSdkInstance.ggInitialize(params);
};

export default NielsenSetup;
