'use strict';

var crypto = require('crypto'),
  gm = require('gm').subClass({
    imageMagick: true
  }), // Enable ImageMagick integration.
  async = require('async'),
  objectAssign = require('object-assign'),
  TEMP_IMAGE_PATH = '/tmp/' + crypto.randomBytes(4).readUInt32LE(0) + '.png';

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
  console.log('watermarker initalized!');
}

function calculateGeometry(boundingBox, maxSide) {
  if (typeof boundingBox.width !== 'number' || typeof boundingBox.height !== 'number') {
    throw new Error('BoundingBox width or height is not a number');
  }
  return '+' + (boundingBox.width - maxSide) + '+' + (boundingBox.height - maxSide);
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

  console.log(image);

  if (!(image && image.ContentType)) {
    return next('image type is missing!');
  }

  // ContentType: 'image/jpeg', ContentType: 'image/jpg', ContentType: 'image/png'
  // if (image.ContentType !== 'png' && image.ContentType !== 'jpg') {
  //   return next('image type is not jpg or png!');
  // }

  console.log('starting watermark!');

  console.log(this);
  console.log(this._resizeWatermarkImage);
  console.log(this._applyWatermark);

  async.waterfall([
    async.apply(_resizeWatermarkImage, image),
    _applyWatermark
  ], next);
}.bind(Watermarker);

//Watermarker.prototype.watermark

Watermarker.prototype._resizeWatermarkImage = _resizeWatermarkImage;

function _resizeWatermarkImage(image, next) {
  console.log('starting watermark resize');
  if (verifyFileTypeFromPath(options.watermarkImagePath, 'png')) {
    return next('Watermark image is not a png');
  }
  console.log(arguments, options);
  gm(image.Body).size(function (err, size) {
    console.log('got image size', err, size);
    if (err) {
      return next(err);
    }
    // TODO: handle non-square watermark images

    var watermarkSide = Math.sqrt(size.width * size.height * (options.relativeSize / 100));

    gm(options.watermarkImagePath).resize(watermarkSide, watermarkSide)
      .write(TEMP_IMAGE_PATH, function (err) {
        console.log('resized watermark image!', err);
        next(err, image, calculateGeometry(size, watermarkSide));
      });
  });
};

Watermarker.prototype._applyWatermark = _applyWatermark;

function _applyWatermark(image, geometry, next) {
  console.log('applying watermark', arguments);
  gm(image.Body)
    .composite(TEMP_IMAGE_PATH)
    .geometry(geometry)
    .dissolve(options.opacity)
    .toBuffer('jpg', function (err, buffer) { // TODO: Remove debug image filetype!
      if (err) {
        console.log('watermark failed');
        next(err);
      } else {
        console.log('watermark success');
        next(null, buffer, image.ContentType);
      }
    });
}

module.exports = Watermarker;
