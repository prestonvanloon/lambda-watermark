(function () {
  'use strict';
  var LambdaWatermark = require('../index');

  var options = {
    replace: true,
    watermarkImagePath: './exampleWatermark.png',
    relativeSize: 5,
    opacity: 50
  };

  exports.handler = function(event, context) {
    console.log(JSON.stringify(event));
    new LambdaWatermark(options)(event, context);
  };
})();
