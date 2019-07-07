const multer = require('./config/multer')

module.exports = app => {

    app.use('/public', app.express.static('public'))

    app.route('/signIn')
        .post(app.api.auth.auth.signIn)

    app.route('/validate_token')
        .post(app.api.auth.auth.validateToken)

    app.route('/articles')
        .get(app.api.articles.articles.get)
        .post(app.api.articles.articles.save)
        
    app.route('/articles/:url')
        .get(app.api.articles.articles.getOne)
    
    app.route('/article/:id')
        .delete(app.api.articles.articles.remove)
        .post(app.api.articles.articles.publish)
        .get(app.api.articles.articles.getOneById)


    app.route('/article/img/:id')
        .post(multer.single('smallImg'), app.api.articles.articles.pushImage)
        .put(multer.single('bigImg'), app.api.articles.articles.pushImage)
        .get(app.api.articles.articles.getImage)
        .delete(app.api.articles.articles.removeImage)


    app.route('/article/management/:id')
        .get(app.api.articles.articles.inactive)
        .post(app.api.articles.articles.boost)
        .put(app.api.articles.articles.active)

    app.route('/users')
        .get(app.api.users.users.get)
        .post(app.api.users.users.save)
        .put(app.api.users.users.changePassword)

    app.route('/user/:id')
        .get(app.api.users.users.getOne)
        .delete(app.api.users.users.remove)

    app.route('/themes')
        .get(app.api.themes.themes.get)
        .post(app.api.themes.themes.save)
        .put(app.api.themes.themes.save)

    app.route('/theme/:id')
        .delete(app.api.themes.themes.remove)
        .head(app.api.themes.themes.active)
        .get(app.api.themes.themes.getOne)

    //app.route('/test')
    //    .get(app.api.themes.themes.test)
    
    app.route('/categories')
    .get(app.api.categories.categories.get)
    .post(app.api.categories.categories.save)
    .put(app.api.categories.categories.save)
    
    app.route('/categories/:id')
        .get(app.api.categories.categories.getByTheme)

    app.route('/category/:id')
        .delete(app.api.categories.categories.remove)
        .head(app.api.categories.categories.active)
        .get(app.api.categories.categories.getOne)
}