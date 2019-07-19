const crypto = require('crypto')
const {algorithmForTag, tagSecret, binEncodeTag, encodeTag, algorithmForAuth, authSecret, binEncodeAuth, encodeAuth } = require('../.env') 

/*  Usado para definir as configurações de segurança da aplicação
    Como algoritmos de ciphers e alguns encodings

    Até o momento está sendo definido para tags de administradores e autores
    e senhas de usuários
*/

module.exports = app => {

    const encryptTag = (tag) => {
        /*  Realiza o cipher para tags */
        
        let cipher = crypto.createCipher(algorithmForTag, tagSecret)
        let crypted = cipher.update(tag, binEncodeTag, encodeTag)
        crypted += cipher.final(encodeTag)
        
        return crypted
    }
    
    const decryptTag = (tagEncrypted) => {
        /*  Realiza o decipher para tags */
        
        let decipher = crypto.createDecipher(algorithmForTag, tagSecret)
        let res = decipher.update(tagEncrypted, encodeTag, binEncodeTag)
        res += decipher.final(binEncodeTag)
        
        return res
    }
    
    const encryptAuth = (password) => {
        /*  Realiza o cipher para autenticação (senhas) */
        
        let cipher = crypto.createCipher(algorithmForAuth, authSecret)
        let crypted = cipher.update(password, binEncodeAuth, encodeAuth)
        crypted += cipher.final(encodeAuth)
        
        return crypted
    }
    
    const decryptAuth = (password) => {
        /*  Realiza o decipher para autenticação (senhas) */
        
        let decipher = crypto.createDecipher(algorithmForAuth, authSecret)
        let res = decipher.update(password, encodeAuth, binEncodeAuth)
        res += decipher.final(binEncodeAuth)
        
        return res
    }
    return {encryptTag, decryptTag, encryptAuth, decryptAuth}
}