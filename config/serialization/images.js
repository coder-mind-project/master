/* eslint-disable no-console */
const fs = require('fs')
const sharp = require('sharp')

/* Responsável pelo gerenciamento de imagens da aplicação */

/**
 *  1 - sharp é utilizado para a compressão de imagens
 *
 *
 */

exports.compressImage = (file, size, currentDirectory) => {
  /* Responsável por comprimir as imagens enviadas para .webp */

  /* Define a qualidade da imagem resultante comprimida pelo sharp */
  const quality = 80

  const path = `${file.path}.webp`

  return sharp(file.path)
    .resize(size)
    .toFormat('webp')
    .webp({
      quality
    })
    .toBuffer()
    .then(async data => {
      // Verificação de existência do arquivo
      await fs.access(file.path, async error => {
        if (!error) {
          // Caso não exista um arquivo, irá gerar um erro. Não existindo o arquivo existe e assim será removido.
          await fs.unlink(file.path, err => {
            if (err) console.log('Error: Remove file operation failed')
          })
        }
      })

      if (currentDirectory) {
        await fs.access(currentDirectory, async error => {
          if (!error) {
            // Caso não exista um arquivo, irá gerar um erro. Não existindo o arquivo existe e assim será removido.
            await fs.unlink(currentDirectory, err => {
              if (err) console.log('Error: Remove file operation failed')
            })
          }
        })
      }

      // Reescrita do mesmo arquivo só que comprimido
      await fs.writeFile(path, data, err => {
        if (err) {
          throw err
        }
      })

      return path
    })
}

exports.removeImage = async path => {
  /* Responsável por remover a imagem do disco */

  try {
    /* Verifica se a imagem existe */
    await fs.access(path, async error => {
      if (!error) {
        // Caso exista, irá remover o arquivo
        await fs.unlink(path, err => {
          if (err) throw false
        })
      } else {
        /*  Caso entre no else, significa que não foi
                    possível encontrar a imagem
                */

        throw false
      }
    })

    /*  Chegando neste ponto significa que a imagem foi
            encontrada e removida com êxito
        */
    return true
  } catch (error) {
    return error
  }
}
