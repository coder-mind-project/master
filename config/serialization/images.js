/* eslint-disable no-console */
const fs = require('fs')
const sharp = require('sharp')

/**
 * @function
 * @description Compress an image to format .webp.
 * @param {Object} file A object containing an image attributes.
 * @param {Number} size Size of the image.
 * @param {String} currentImage A current image path if one exists.
 * @param {Number} imageQuality Quality of image. 0 for min and 100 for max.
 * @returns {String} A path of compressed image.
 */
exports.compressImage = (file, size, currentImage, imageQuality = 100) => {
  let quality = parseInt(imageQuality)
  if (quality < 0 || quality > 100) quality = 100

  const fileName = `${file.path}.webp`

  return sharp(file.path)
    .resize(size)
    .toFormat('webp')
    .webp({
      quality
    })
    .toBuffer()
    .then(async data => {
      fs.access(file.path, error => {
        if (!error) {
          fs.unlink(file.path, err => {
            if (err) console.log('Error: Remove file operation failed')
          })
        }
      })

      if (currentImage) {
        fs.access(currentImage, error => {
          if (!error) {
            fs.unlink(currentImage, err => {
              if (err) console.log('Error: Remove file operation failed')
            })
          }
        })
      }

      fs.writeFile(fileName, data, err => {
        if (err) {
          throw err
        }
      })

      return fileName
    })
}
/**
 * @function
 * @description Remove a image.
 * @param {String} path Path of the image.
 */
exports.removeImage = path => {
  try {
    fs.access(path, error => {
      if (!error) {
        fs.unlink(path, err => {
          if (err) throw false
        })
      } else {
        throw false
      }
    })
    return true
  } catch (error) {
    return error
  }
}
