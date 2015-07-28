(function () {
  'use strict';

  var Watermarker = require('../lib/watermarker'),
    should = require('should');

  describe('Watermarker', function () {
    describe('options', function () {
      it('should provide some default options', function () {
        var watermarker = new Watermarker();
        watermarker.options.should.have.property('replace');
        watermarker.options.should.have.property('opacity');
        watermarker.options.should.have.property('relativeSize');
      });
      it('should return new instance of watermarker if called without `new`', function () {
        Watermarker().should.be.instanceOf(Watermarker); // jshint ignore:line
      });
      it('should not overwrite passed in options', function () {
        var options = {
          replace: false,
          debug: true,
          opacity: 100,
          relativeSize: 7
        };
        var watermarker = new Watermarker(options);
        should.deepEqual(watermarker.options, options);
      });
      it('should validate options');
    });

    describe('watermark', function () {
      var watermarker;
      beforeEach(function () {
        watermarker = new Watermarker();
      });
      it('should return an error image.buffer is not a buffer', function (done) {
        watermarker.watermark({
          buffer: 'not a buffer'
        }, function (err) {
          err.should.be.equal('image buffer is not a buffer!');
          done();
        });
      });
      it('should return an error if image.type is missing', function (done) {
        watermarker.watermark({
          buffer: new Buffer('')
        }, function (err) {
          err.should.be.equal('image type is missing!');
          done();
        });
      });
      it('should return an error if image.type is not png or jpg', function (done) {
        watermarker.watermark({
          buffer: new Buffer(''),
          type: 'mp3'
        }, function (err) {
          err.should.be.equal('image type is not jpg or png!');
          done();
        });
      });
      it('should call waterfall functions by passing image');
    });
    describe('_resizeWatermarkImage', function () {
      var watermarker;
      beforeEach(function () {
        watermarker = new Watermarker({
          watermarkImagePath: 'something.png'
        });
      });
      it('should fail if image is not png', function (done) {
        watermarker = new Watermarker({
          watermarkImagePath: 'something.jpg'
        });
        watermarker._resizeWatermarkImage({}, function (err) {
          err.should.be.equal('Watermark image is not a png');
          done();
        });
      });
      it('should handle square objects');
      it('should handle rectangular objects');
      it('should write file to temp path');

      describe('calculateGeometry', function () {
        var watermarker;
        beforeEach(function () {
          watermarker = new Watermarker();
        });
        it.skip('should throw error if boundingBox width is not a number', function () {

        });
        it('should handle square objects');
        it('should handle rectangular objects');
      });
    });
    describe('_applyWatermark', function () {
      it('should apply options opacity');
      it('should call callback with buffer');
      it('should call callback with imageType');
    });
  });

})();
