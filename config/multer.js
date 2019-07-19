const multer = require('multer')

/**
 *  Configuração para o disk storage do multer
 *  É necessário para persistir os arquivos enviados para a aplicação
 *  
 *  Obs: Até então o disk Storage esta configurado para somente persistir imagens
 */

module.exports = (multer(
    {
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, './public/imgs/')
            },
            filename: (req, file, cb) => {
                const fileName = `${Date.now()}`
                cb(null, `${fileName}`)
            }
        }),
        fileFilter: (req, file, cb) => {
            const fileTypes = ['image/png', 'image/jpg', 'image/jpeg']
            const isAccepted = fileTypes.find(currentFormat => currentFormat == file.mimetype)
            return cb(null, isAccepted)
        },
        limits: 10000
    }
))