'use strict';

var async = require('async'),
  AWS = require('aws-sdk'),
  s3 = new AWS.S3(),
  Watermarker = require('./watermarker');

var lambdaWrapper = function (options) {
  // TODO: provide default options or at least require watermarkImagePath

  var watermarker = new Watermarker(options);

  return function (event, context) {
    var srcBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    var srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    // TODO: figure out dist bucket/key based on options (replace)
    var dstBucket = srcBucket;
    var dstKey = srcKey;

    var typeMatch = inferImageType(srcKey);

    var imageType = typeMatch[1];
    if (imageType.toLowerCase() !== "jpg" && imageType.toLowerCase() !== "png") {
      console.warn('skipping non-image ' + srcKey);
      return null;
    }

    function download(next) {
      // Download the image from S3 into a buffer.
      s3.getObject({
        Bucket: srcBucket,
        Key: srcKey
      }, next);
    }

    function upload(data, contentType, next) {
      // Stream the transformed image to dist S3 bucket.
      s3.putObject({
        Bucket: dstBucket,
        Key: dstKey,
        Body: data,
        ContentType: contentType
      }, next);
    }

    function done(err) {
      if (err) {
        console.error('Unable to watermark ' + srcBucket + '/' + srcKey +
          ' and upload to ' + dstBucket + '/' + dstKey + ' due to an error: ' + err);
      } else {
        console.log('Successfully watermarked ' + srcBucket + '/' + srcKey +
          ' and uploaded to ' + dstBucket + '/' + dstKey);
      }
      context.done();
    }

    async.waterfall([
      download,
      watermarker.watermark.bind(watermarker),
      upload
    ], done);
  };
};

function inferImageType(filename) {
  var match = filename.match(/\.([^.]*)$/);
  if (!match) {
    throw new Error('unable to infer image type for key: ' + filename);
  }
  return match;
}

module.exports = lambdaWrapper;
