const fs = require('fs')
const sharp = require('sharp')

exports.compressImage = (file, size, currentDirectory) => {


    const path = `${file.path}.webp`
    return sharp(file.path)
        .resize(size)
        .toFormat('webp')
        .webp({
            quality: 80
        })
        .toBuffer()
        .then( async data => {

            //Verificação de existência do arquivo
            await fs.access(file.path, async (error) => {
                if(!error){
                    //Caso não exista um arquivo, irá gerar um erro. Não existindo o arquivo existe e assim será removido.
                    await fs.unlink(file.path, (err) => {
                        if(err) console.log('Erro ao remover o arquivo')
                    })
                }
            })
            
            if(currentDirectory){
                await fs.access(currentDirectory, async (error) => {
                    if(!error){
                        //Caso não exista um arquivo, irá gerar um erro. Não existindo o arquivo existe e assim será removido.
                        await fs.unlink(currentDirectory, (err) => {
                            if(err) console.log('Erro ao remover o arquivo')
                        })
                    }
                })
            }
            
            //Reescrita do mesmo arquivo só que comprimido
            await fs.writeFile(path, data, err => {
                if(err) {
                    throw err
                }
            })

            return path
        })
}

exports.readImage = async (file) => {

        await fs.access(file, error => {
            if(error) return false
        })

        return file
}

exports.removeImage = async (path) => {
    try {
        await fs.access(path, async (error) => {
            if(!error){
                //Encontrou o arquivo
                await fs.unlink(path, (err) => {
                    //Não conseguiu remover o arquivo
                    if(err) throw false
                })
            }else{
                //Não encontrou o arquivo
                throw false
            }
        })

        return true
    } catch (error) {
        return error
    }
}