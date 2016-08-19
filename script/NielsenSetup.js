require(['nielsen'], function(Nielsen) {
  'use strict';
  var NielsenSetup = function() {
    window.nielsenMetadataObject = {
      'dataSrc': 'cms',
      'stationType': 1,
      'type': 'radio',
      'assetid': 'KCMP-FM',
      'provider': 'MinnesotaPublicRadio'
    };

    window._nolggGlobalParams = {
      sfcode: 'cert',
      apid: 'T9EC85694-71F6-4667-B797-D8F2A939365F',
      apn: 'test-setup'
    };

    window.nSdkInstance = window.NOLCMB.getInstance(window._nolggGlobalParams);
    window.nSdkInstance.ggInitialize(window._nolggGlobalParams);
  };

  return new NielsenSetup();
}, function(err) {
  // Do nothing, some people use ad blockers.
});
