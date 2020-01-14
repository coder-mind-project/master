module.exports = app => {
    const site_key = '6LdaWc0UAAAAADuDPPovaKqF6iOGXTKHekzkkK09'
    const secret_key = '6LdaWc0UAAAAAJot_S9m19uidRRZ6ApnSBb2qWvG'
    const uri = 'https://www.google.com/recaptcha/api/siteverify'

    
    return {site_key, secret_key, uri}
}