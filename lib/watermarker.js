'use strict';

var gm = require('gm').subClass({
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

function calculateGeometry(boundingBox, minSide) {
  return minSide + 'x' + minSide +  // minimum height & width
    '+0+0' + // offset
    '^'; // Maintain aspect ratio
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

  if (!(image && image.ContentType)) {
    return next('image type is missing!');
  }

  if (image.ContentType.toLowerCase() !== 'image/png' &&
      image.ContentType.toLowerCase() !== 'image/jpeg' &&
      image.ContentType.toLowerCase() !== 'image/jpg') {
    return next('image type is not jpg or png!');
  }
  async.waterfall([
    async.apply(this._resizeWatermarkImage.bind(this), image),
    this._applyWatermark.bind(this)
  ], next);
};

Watermarker.prototype._resizeWatermarkImage = function(image, next) {
  if (verifyFileTypeFromPath(this.options.watermarkImagePath, 'png')) {
    return next('Watermark image is not a png');
  }
  var relativeSize = this.options.relativeSize;
  gm(image.Body).size(function (err, size) {
    var watermarkSide = Math.sqrt(size.width * size.height * (relativeSize / 100));
    next(err, image, calculateGeometry(size, watermarkSide));
  });
};

Watermarker.prototype._applyWatermark = function(image, geometry, next) {
  gm(image.Body)
    .composite(this.options.watermarkImagePath)
    .geometry(geometry)
    .gravity('SouthEast')
    .dissolve(this.options.opacity)
    .toBuffer(function (err, buffer) {
      next(err, buffer, image.ContentType);
    });
};

module.exports = Watermarker;
