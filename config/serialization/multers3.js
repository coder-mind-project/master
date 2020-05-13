/**
 * @module multerS3
 * @description Data store configuration for amazon S3 service, @see https://aws.amazon.com/s3/ .
 * @returns {Function} A multer middleware.
 */
const multer = require('multer')
const multerS3 = require('multer-s3')
const { s3, bucket } = require('../aws/s3')

const fileFilter = (req, file, cb) => {
  const fileTypes = ['image/png', 'image/jpg', 'image/jpeg']
  const isAccepted = fileTypes.find(currentFormat => currentFormat === file.mimetype)
  return cb(isAccepted ? null : new Error('Image type is invalid'), isAccepted)
}

const fileFolder = path => {
  if (path.match('articles')) {
    return 'articles/images/'
  }

  if (path.match('users')) {
    return 'users/images/'
  }

  return ''
}

module.exports = multer({
  storage: multerS3({
    s3,
    bucket,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { provider: 'master', poweredBy: 'codermind' })
    },
    key: (req, file, cb) => {
      cb(null, `${fileFolder(req.route.path)}${Date.now().toString()}`)
    }
  }),
  fileFilter,
  limits: 10000
})
