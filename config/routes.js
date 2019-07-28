const multer = require('./multer')

module.exports = app => {

    /* Resource for public access */
    app.use('/public', app.express.static('public'))



    /* AUTHENTICATION RESOURCES */

    /* Resource for authentication */
    app.route('/signIn')
        .post(app.api.auth.auth.signIn)

    /* Resource for verify authentication */
    app.route('/validate_token')
        .post(app.api.auth.auth.validateToken)
        

    
    /* ARTICLES RESOURCES */

    /* Resource for general management. EX: get some articles, create, update */
    app.route('/articles')
        .all(app.config.passport.authenticate())
        .get(app.api.articles.articles.get)
        .post(app.api.articles.articles.save)
        .put(app.api.articles.articles.save)
        
    /* Resource for management of articles with custom uris */
    app.route('/articles/:url')
        .all(app.config.passport.authenticate())
        .get(app.api.articles.articles.getOne)
        
    /* Resource for general management. ex: publish, delete, getByID, boost, etc */
    app.route('/articles/management/:id')
        .all(app.config.passport.authenticate())
        .delete(app.api.articles.articles.remove)
        .patch(app.api.articles.articles.management)
        .get(app.api.articles.articles.getOneById)

    /* Resource for img's management */
    app.route('/articles/img/:id')
        .all(app.config.passport.authenticate())
        .post(multer.single('smallImg'), app.api.articles.articles.pushImage)
        .put(multer.single('bigImg'), app.api.articles.articles.pushImage)
        .delete(app.api.articles.articles.removeImage)
        


        
    /* USERS RESORUCES */

    /* Resource for general management. Ex: get some users, create, update, change passwords */
    app.route('/users')
        .all(app.config.passport.authenticate())
        .get(app.api.users.users.get)
        .post(app.api.users.users.save)
        .patch(app.api.users.users.changePassword)
        
    /* Resource for management of users with informed ID */
    app.route('/users/:id')
        .all(app.config.passport.authenticate())
        .get(app.api.users.users.getOne)
        .delete(app.api.users.users.remove)
        .patch(app.api.users.users.updateExtraInfo)
        .put(app.api.users.users.save)

    /* Resource for img's management */
    app.route('/users/img/:id')
        .patch(multer.single('profilePhoto'), app.api.users.users.configProfilePhoto)
        .delete(app.api.users.users.removeProfilePhoto)

        
    /* THEMES RESOURCES */

    /* Resource for general management. Ex: get some themes, create, update */
    app.route('/themes')
        .all(app.config.passport.authenticate())
        .get(app.api.themes.themes.get)
        .post(app.api.themes.themes.save)
        
    /* Resource for management of themes with informed ID */
    app.route('/themes/:id')
        .all(app.config.passport.authenticate())
        .get(app.api.themes.themes.getOne)
        .delete(app.api.themes.themes.remove)
        .put(app.api.themes.themes.save)
        


    /* CATEGORIES RESOURCES */

    /* Resorce for general management. Ex: get some categories, create, update */
    app.route('/categories')
        .all(app.config.passport.authenticate())
        .get(app.api.categories.categories.get)
        .post(app.api.categories.categories.save)
        
        /* Resource for management of categories with informed ID */
        app.route('/categories/:id')
        .all(app.config.passport.authenticate())
        .delete(app.api.categories.categories.remove)
        .get(app.api.categories.categories.getOne)
        .put(app.api.categories.categories.save)
    
    /* Resource for management of categories through theme's ID */
    app.route('/categories/theme/:id')
        .all(app.config.passport.authenticate())
        .get(app.api.categories.categories.getByTheme)
        
        
    /* Resource for management of comments */
    app.route('/comments')
        .all(app.config.passport.authenticate())
        .get(app.api.articles.comments.get)
        .patch(app.api.articles.comments.readComment)
        .post(app.api.articles.comments.sendComment)
        
    app.route('/comments/history/:id')
        .all(app.config.passport.authenticate())
        .get(app.api.articles.comments.getHistory)

    
}