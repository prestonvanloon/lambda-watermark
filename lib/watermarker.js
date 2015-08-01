'use strict';

var crypto = require('crypto'),
  gm = require('gm').subClass({
    imageMagick: true
  }), // Enable ImageMagick integration.
  async = require('async'),
  objectAssign = require('object-assign');

function Watermarker(options) {
  if (!(this instanceof Watermarker)) {
    return new Watermarker(options);
  }
  var defaultOptions = {
    opacity: 50,
    relativeSize: 5
  };

  this.options = objectAssign(defaultOptions, options || {});
  // TODO: validate these options
}

function calculateGeometry(boundingBox, maxSide) {
  return maxSide + 'x' + maxSide + '+' + (boundingBox.width - maxSide) + '+' + (boundingBox.height - maxSide);
}

function verifyFileTypeFromPath(path, type) {
  var typeMatch = path && path.match(/\.([^.]*)$/);
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

  // if (!(image && image.ContentType)) {
  //   return next('image type is missing!');
  // }

  // ContentType: 'image/jpeg', ContentType: 'image/jpg', ContentType: 'image/png'
  // if (image.ContentType !== 'png' && image.ContentType !== 'jpg') {
  //   return next('image type is not jpg or png!');
  // }

  async.waterfall([
    async.apply(_resizeWatermarkImage, image),
    _applyWatermark
  ], next);
}.bind(Watermarker);

Watermarker.prototype._resizeWatermarkImage = _resizeWatermarkImage;

function _resizeWatermarkImage(image, next) {
  if (verifyFileTypeFromPath(this.options.watermarkImagePath, 'png')) {
    return next('Watermark image is not a png');
  }
  var relativeSize = this.options.relativeSize;
  gm(image.Body).size(function (err, size) {
    if (err) {
      return next(err);
    }

    var watermarkSide = Math.sqrt(size.width * size.height * (relativeSize / 100));
    next(null, image, calculateGeometry(size, watermarkSide));
  });
};

Watermarker.prototype._applyWatermark = _applyWatermark;

function _applyWatermark(image, geometry, next) {
  gm(image.Body)
    .composite(this.options.watermarkImagePath)
    .geometry(geometry)
    .dissolve(this.options.opacity)
    .toBuffer('jpg', function (err, buffer) { // TODO: Remove debug image filetype!
      if (err) {
        next(err);
      } else {
        next(null, buffer, image.ContentType);
      }
    });
}

module.exports = Watermarker;
