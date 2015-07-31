'use strict';

var crypto = require('crypto'),
  gm = require('gm').subClass({
    imageMagick: true
  }), // Enable ImageMagick integration.
  async = require('async'),
  objectAssign = require('object-assign');

  // TODO: REMOVE THIS DEBUG GLOBAL!
  // this.options aren't being passed around to prototypes :(
  var options = {
    replace: true,
    debug: true,
    watermarkImagePath: './example/ABL_watermark_new.png',
    relativeSize: 10,
    opacity: 40
  };

function Watermarker(options) {
  if (!(this instanceof Watermarker)) {
    return new Watermarker(options);
  }
  var defaultOptions = {
    replace: true,
    debug: false,
    opacity: 50,
    relativeSize: 5
  };

  this.options = objectAssign(defaultOptions, options || {});
  // TODO: validate these options
}

function calculateGeometry(boundingBox, maxSide) {
  // TODO: handle non-square watermark images
  if (typeof boundingBox.width !== 'number' || typeof boundingBox.height !== 'number') {
    throw new Error('BoundingBox width or height is not a number');
  }
  return maxSide + 'x' + maxSide + '+' + (boundingBox.width - maxSide) + '+' + (boundingBox.height - maxSide);
}

function verifyFileTypeFromPath(path, type) {
  var typeMatch = path.match(/\.([^.]*)$/);
  if (!typeMatch) {
    throw new Error('Could not infer filetype from path');
  }

  var imageType = typeMatch[1];
  return imageType.toLowerCase() !== type.toLowerCase();
}

Watermarker.prototype.watermark = function (image, next) {
  // if (!(image && image.Body instanceof Buffer)) {
  //   console.log('image:', image, image.Body instanceof Buffer);
  //   return next('image buffer is not a buffer!');
  // }

  if (!(image && image.ContentType)) {
    return next('image type is missing!');
  }

  // ContentType: 'image/jpeg', ContentType: 'image/jpg', ContentType: 'image/png'
  // if (image.ContentType !== 'png' && image.ContentType !== 'jpg') {
  //   return next('image type is not jpg or png!');
  // }

  async.waterfall([
    async.apply(_resizeWatermarkImage, image),
    _applyWatermark
  ], next);
}.bind(Watermarker);

//Watermarker.prototype.watermark

Watermarker.prototype._resizeWatermarkImage = _resizeWatermarkImage;

function _resizeWatermarkImage(image, next) {
  if (verifyFileTypeFromPath(options.watermarkImagePath, 'png')) {
    return next('Watermark image is not a png');
  }
  gm(image.Body).size(function (err, size) {
    if (err) {
      return next(err);
    }
    var watermarkSide = Math.sqrt(size.width * size.height * (options.relativeSize / 100));

    next(null, image, calculateGeometry(size, watermarkSide));
  });
};

Watermarker.prototype._applyWatermark = _applyWatermark;

function _applyWatermark(image, geometry, next) {
  console.log('applying watermark');
  gm(image.Body)
    .composite(options.watermarkImagePath)
    .geometry(geometry)
    .dissolve(options.opacity)
    .toBuffer('jpg', function (err, buffer) { // TODO: Remove debug image filetype!
      if (err) {
        next(err);
      } else {
        next(null, buffer, image.ContentType);
      }
    });
}

module.exports = Watermarker;
