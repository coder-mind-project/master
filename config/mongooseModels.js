/*
    Schemas de configurações para as coleções do mongoDB via Mongoose
*/

module.exports = app => {

    
    // Schema para os usuários do sistema. Tanto administradores e autores
    const user = new app.mongo.Schema({
        _id: {type: app.mongo.Schema.ObjectId, auto: true},
        name: String,
        gender: String,
        birthDate: Date,
        profilePhoto: String,
        instagram: String,
        twitter: String,
        github: String,
        youtube: String,
        cpf: {type: String, unique: true},
        email: {type: String, unique: true},
        telphone: {type: String, unique: true},
        celphone: {type: String, unique: true},
        address: String,
        number: Number,
        password: String,
        createdAt: Date,
        deleted: Boolean,
        expireToken: String,
        rescuePassword: String,
        tagAdmin: String,
        occupation: String,
        especiality: String,
        tagAuthor: String,
    })

    const User = app.mongo.model('users', user)


    // Schema para os artigos do sistema
    const article = new app.mongo.Schema({
        _id: {type: app.mongo.Schema.ObjectId, auto: true},
        author: Object,
        title: String,
        theme: Object,
        category: Object,
        shortDescription: String,
        longDescription: String,
        textArticle: String,
        smallImg: String,
        mediumImg: String,
        bigImg: String,
        customURL: {type: String, unique: true},
        viewsCounter: Number,
        rating: Number,
        sharesCounter: Number,
        likesCounter: Number,
        dislikesCounter: Number,
        createdAt: Date,
        updatedAt: Date,
        publishAt: Date,
        published: Boolean,
        boosted: Boolean,
        deleted: Boolean,
        inactivated: Boolean
    })
    
    const Article = app.mongo.model('articles', article)
    
    
    // Schema para os temas dos artigos
    const theme = new app.mongo.Schema({
        _id: {type: app.mongo.Schema.ObjectId, auto: true},
        name: {type: String, unique: true},
        alias: String,
        description: String,
        state: String
    })

    const Theme = app.mongo.model('themes', theme)
    

    //Schema para as categorias dos artigos
    const category = new app.mongo.Schema({
        _id: {type: app.mongo.Schema.ObjectId, auto: true},
        name: {type: String, unique: true},
        theme: Object,
        alias: String,
        description: String,
        state: String
    })

    const Category = app.mongo.model('categories', category)


    return {User, Article, Theme, Category}
}