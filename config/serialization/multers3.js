const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')

const env = require('../environment')

const { production, develop } = env.aws

aws.config.update({
  secretAccessKey: develop.secretAccessKey,
  accessKeyId: develop.accessKeyId,
  region: develop.region
})

const s3 = new aws.S3()

const fileFilter = (req, file, cb) => {
  const fileTypes = ['image/png', 'image/jpg', 'image/jpeg']
  const isAccepted = fileTypes.find(currentFormat => currentFormat === file.mimetype)
  return cb(isAccepted ? null : new Error('Image type is invalid'), isAccepted)
}

module.exports = multer({
  storage: multerS3({
    s3,
    bucket: develop.bucket,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { provider: 'master', poweredBy: 'codermind' })
    },
    key: (req, file, cb) => {
      cb(null, Date.now().toString())
    }
  }),
  fileFilter,
  limits: 10000
})
