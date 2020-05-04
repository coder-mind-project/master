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
  secretAccessKey: develop.secretAccessKey,
  accessKeyId: develop.accessKeyId,
  region: develop.region
})

const s3 = new aws.S3()

module.exports = { s3, bucket: develop.bucket }
