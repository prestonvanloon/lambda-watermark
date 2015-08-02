(function () {
  'use strict';

  var rewire = require('rewire'),
    Watermarker = rewire('../lib/watermarker'),
    should = require('should'),
    sinon = require('sinon'),
    watermarkerHelper = require('./watermarker.helper');

  describe('Watermarker', function () {
    describe('options', function () {
      it('should provide some default options', function () {
        var watermarker = new Watermarker();
        watermarker.options.should.have.property('opacity');
        watermarker.options.should.have.property('relativeSize');
      });

      it('should return new instance of watermarker if called without `new`', function () {
        Watermarker().should.be.instanceOf(Watermarker); // jshint ignore:line
      });

      it('should not overwrite passed in options', function () {
        var options = {
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
        watermarker = new Watermarker(watermarkerHelper.validOptions);
        watermarker._resizeWatermarkImage = sinon.stub().yields();
      });

      it('should call _resizeWatermarkImage', function() {
        watermarker.watermark(watermarkerHelper.validImage, function(){});
        watermarker._resizeWatermarkImage.called.should.be.true();
      });

      it('should call _applyWatermark', function(done) {
        watermarker._resizeWatermarkImage = function(img, cb) { cb(); };
        watermarker._applyWatermark = function() { done(); };
        watermarker.watermark(watermarkerHelper.validImage);
      });

      it.skip('should return an error image.buffer is not a buffer', function (done) {
        watermarker.watermark({
          Body: 'not a buffer'
        }, function (err) {
          err.should.be.equal('image buffer is not a buffer!');
          done();
        });
      });

      it('should return an error if image.type is missing', function (done) {
        watermarker.watermark({}, function (err) {
          err.should.be.equal('image type is missing!');
          done();
        });
      });

      it('should return an error if image.type is not png or jpg', function (done) {
        watermarker.watermark({
          ContentType: 'image/tiff'
        }, function (err) {
          err.should.be.equal('image type is not jpg or png!');
          done();
        });
      });

      it('should call waterfall functions by passing image', function(done) {
        watermarker._resizeWatermarkImage = function(image) {
          image.should.be.equal(watermarkerHelper.validImage);
          done();
        };
        watermarker.watermark(watermarkerHelper.validImage);
      });
    });
    describe('_resizeWatermarkImage', function () {
      var watermarker;
      beforeEach(function() {
        Watermarker.__set__('gm', function() {
          return {
            size: function(cb) {
              cb(null, {
                width: 1000,
                height: 200
              });
            }
          };
        });

        watermarker = new Watermarker(watermarkerHelper.validOptions);
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

      it('should throw error if image path has no extension', function (done) {
        watermarker = new Watermarker({
          watermarkImagePath: 'something'
        });

        try {
          watermarker._resizeWatermarkImage({});
        } catch (e) {
          e.message.should.be.equal('Could not infer filetype from path');
          done();
        }
      });

      describe('calculateGeometry', function () {
        watermarker = new Watermarker(watermarkerHelper.validOptions);

        it('should calculate geometry string', function(done) {
          watermarker._resizeWatermarkImage({}, function (err, image, geometry) {
            geometry.should.be.equal('100x100+0+0^');
            done();
          });
        });;
      });
    });
    describe('_applyWatermark', function () {
      var watermarker, gmObj, testGeometry ='100x100+0+0', testBuffer = new Buffer('test');

      beforeEach(function() {
        gmObj = {
          composite: sinon.stub().returnsThis(),
          geometry: sinon.stub().returnsThis(),
          dissolve: sinon.stub().returnsThis(),
          gravity: sinon.stub().returnsThis(),
          toBuffer: function(cb) {
            return cb(null, testBuffer);
          }
        };
        Watermarker.__set__('gm', function() {
            return gmObj;
        });
        watermarker = new Watermarker(watermarkerHelper.validOptions);
          watermarker._applyWatermark({}, testGeometry, function() {});
      });

      it('should apply options opacity', function() {
        gmObj.dissolve.calledWithExactly(watermarkerHelper.validOptions.opacity);
      });

      it('should call composite with thumbnail path', function(){
         gmObj.composite.calledWithExactly(watermarkerHelper.validOptions.watermarkImagePath);
      });

      it('should call gravity SouthEast', function(){
         gmObj.composite.calledWithExactly('SouthEast'); // calculateGeometry depends on this to be set!
      });

      it('should call geometry with passed geometry value', function() {
        gmObj.geometry.calledWithExactly(testGeometry);
      })

      it('should call callback with buffer', function(done) {
        watermarker._applyWatermark({}, null, function(err, buffer, contentType) {
          buffer.should.be.equal(testBuffer);
          done();
        });
      });

      it('should call callback with imageType', function(done) {
        watermarker._applyWatermark({ ContentType: 'image/jpeg' }, null, function(err, buffer, contentType){
          contentType.should.be.equal('image/jpeg');
          done();
        })
      });
    });
  });

})();
