/* eslint-disable no-console */
const fs = require('fs')
const sharp = require('sharp')

/**
 * @function
 * @description Compress an image to format .webp in specific folder.
 * @param {Object} settings Settings of image compressing. Look at settings attributes below.
 *
 * @property {Object} file - A object containing an image attributes.
 * @property {Number} size - Size of the image.
 * @property {String} currentImage - A current image path if one exists.
 * @property {Number} imageQuality - Quality of image. 0 for min and 100 for max.
 * @property {String} folder - Folder destination after image root directory
 *
 * @returns {String} A path of compressed image.
 */
exports.compressImage = settings => {
  const { file, size, currentImage, imageQuality, folder } = settings

  let quality = parseInt(imageQuality) || 100
  if (quality < 0 || quality > 100) quality = 100

  /**
   * @example file.destination = "./public/imgs/"
   * @example folder = "<folder-name>/"
   * Attention to "/" character after folder name.
   * @example file.filename = "<file-name>"
   * Attention the details that the image has no extension.
   */
  const fileName = `${file.destination}${folder}${file.filename}.webp`

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
