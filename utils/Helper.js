const _ = require('lodash')

function hasMP4Extension(grouped_s3_urls) {
  return _.some(grouped_s3_urls.split(','), url => url.match(/.mp4$/))
}

module.exports = {
  hasMP4Extension
}