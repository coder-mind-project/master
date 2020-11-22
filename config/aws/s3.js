/**
 * @module s3
 * @description A configured S3 class instance
 * @returns {Object} S3 instance.
 */

const aws = require('aws-sdk')
const env = require('../environment')

/**
 * @description Change to `production` for all `develop` ocurrences to set bucket production
 */
const { production, develop } = env.aws

aws.config.update({
  secretAccessKey: production.secretAccessKey,
  accessKeyId: production.accessKeyId,
  region: production.region
})

const s3 = new aws.S3()

/**
 * @function
 * @description Get S3 bucket object key from their url.
 * @param {String} url - S3 Bucket Object url
 *
 * @returns An object containing `status` of operation: `true` for successful,
 *  `false` for fail; `key` containing the object key; `error` containing the stack error,
 *  if happens.
 */
const getBucketKeyFromUrl = url => {
  try {
    if (url && typeof url === 'string') {
      const parts = url.split('.com/')

      return { status: true, key: parts[1], error: null }
    }

    throw new Error(`typeof url is ${typeof url}, expected string`)
  } catch (error) {
    return { status: false, key: null, error }
  }
}

module.exports = { s3, bucket: production.bucket, getBucketKeyFromUrl }
