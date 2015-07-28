module.exports = {
  event: {
    Records: [{
      s3: {
        bucket: {
          name: 'testBucket'
        },
        object: {
          key: 'image.jpg'
        }
      }
    }]
  },
  eventWithBadKey: {
    Records: [{
      s3: {
        bucket: {
          name: 'testBucket'
        },
        object: {
          key: 'image'
        }
      }
    }]
  },
  eventWithWrongFileType: {
    Records: [{
      s3: {
        bucket: {
          name: 'testBucket'
        },
        object: {
          key: 'video.mp4'
        }
      }
    }]
  }
};
