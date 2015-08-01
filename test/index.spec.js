(function() {
  'use strict';

  var expect = require('expect.js');
  var lambdaWatermark = require('../index');

  describe('Index', function() {
    it('should return a lambdaWrapper!', function() {
      expect(lambdaWatermark).to.be.ok();
    });
  });

})();
