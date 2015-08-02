(function () {
  'use strict';
  var LambdaWatermark = require('../index');

  var options = {
    watermarkImagePath: './example/ABL_watermark_new.png',
    relativeSize: 5,
    opacity: 50
  };

  exports.handler = function(event, context) {
    new LambdaWatermark(options)(event, context);
  };
})();
