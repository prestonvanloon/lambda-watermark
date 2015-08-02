(function () {
  'use strict';

  var helper = require('./lambdaWrapper.helper'),
    sinon = require('sinon'),
    rewire = require('rewire'),
    LambdaWrapper = rewire('../lib/lambdaWrapper'),
    s3Mock = {
      getObject: sinon.stub().yields(),
      putObject: sinon.stub().yields()
    },
    WatermarkerMock = function() {
      return { watermark: function(next) { next(null, null, null); } };
    };

  LambdaWrapper.__set__('s3', s3Mock);
  LambdaWrapper.__set__('Watermarker', WatermarkerMock);
  var lambdaWrapper = new LambdaWrapper({});

  describe('LambdaWrapper', function () {
    beforeEach(function () {
      sinon.stub(console, 'warn').returns(void 0);
    });
    afterEach(function () {
      console.warn.restore();
    });
    it('should provide some default options');
    it('should determine correct dist bucket');
    it('should throw error when image type cannot be inferred', function () {
      (function () {
        lambdaWrapper(helper.eventWithBadKey);
      })
      .should.throw(/^unable to infer image type for key:.*/);
    });
    describe('when file type is not png or jpg', function () {
      var contextDoneSpy, result;
      beforeEach(function () {
        contextDoneSpy = sinon.spy();
        result = lambdaWrapper(helper.eventWithWrongFileType, {
          done: contextDoneSpy
        });
      });
      it('should return null', function () {
        (result === null).should.be.true();
      });
      it('should not call context.done', function () {
        contextDoneSpy.called.should.be.false();
      });
      it('should print to console.warn', function () {
        console.warn.calledWithMatch(/^skipping non-image.*/).should.be.true();
      });
    });
    describe('async.waterfall', function () {
      describe('download', function () {
        beforeEach(function() {
          lambdaWrapper(helper.event, {});
        });
        it('should download the image', function() {
          s3Mock.getObject.called.should.be.true();
        });
      });
      describe('upload', function () {
        beforeEach(function() {
          lambdaWrapper(helper.event, {});
        });
        it('should upload the image', function() {
          s3Mock.putObject.called.should.be.true();
        });
      });
      describe('done', function () {
        // beforeEach(function() {
        //   sinon.stub(console, 'error').returns(void 0);
        //   sinon.stub(console, 'log').returns(void 0);
        // });
        // afterEach(function () {
        //   console.error.restore();
        //   console.log.restore();
        // });
        it.skip('should report error to console.error', function() {
          console.error.calledWithMatch(/^Unable to watermark.*/).should.be.true();
        });
        it.skip('should report success to console.log', function() {
          console.log.calledWithMatch(/^Successfully watermarked/).should.be.true();
        });
        it('should call context.done', function(done) {
          lambdaWrapper(helper.event, {
            done: done
          });
        });
      });
    });
  });

})();
