const crypto = require('crypto')
const {algorithmForTag, tagSecret, binEncodeTag, encodeTag, algorithmForAuth, authSecret, binEncodeAuth, encodeAuth } = require('../.env') 

module.exports = app => {

    const encryptTag = (tag) => {
        let cipher = crypto.createCipher(algorithmForTag, tagSecret)
        let crypted = cipher.update(tag, binEncodeTag, encodeTag)
        crypted += cipher.final(encodeTag)

        return crypted
    }
    
    const decryptTag = (tagEncrypted) => {
        let decipher = crypto.createDecipher(algorithmForTag, tagSecret)
        let res = decipher.update(tagEncrypted, encodeTag, binEncodeTag)
        res += decipher.final(binEncodeTag)
        
        return res
    }
    
    const encryptAuth = (password) => {
        let cipher = crypto.createCipher(algorithmForAuth, authSecret)
        let crypted = cipher.update(password, binEncodeAuth, encodeAuth)
        crypted += cipher.final(encodeAuth)
        
        return crypted
    }
    
    const decryptAuth = (password) => {
        let decipher = crypto.createDecipher(algorithmForAuth, authSecret)
        let res = decipher.update(password, encodeAuth, binEncodeAuth)
        res += decipher.final(binEncodeAuth)
        
        return res
    }
    return {encryptTag, decryptTag, encryptAuth, decryptAuth}
}