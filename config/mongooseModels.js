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
        deleted: Boolean,
        expireToken: String,
        rescuePassword: String,
        tagAdmin: String,
        occupation: String,
        especiality: String,
        tagAuthor: String,
    },{
        timestamps: {
            createdAt: 'created_at'
        }
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
        publishAt: Date,
        published: Boolean,
        boosted: Boolean,
        deleted: Boolean,
        inactivated: Boolean,
    },{
        timestamps: {
            createdAt: 'created_at'
        }
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





    //Schema para as visualizações dos artigos
    const view = new app.mongo.Schema({
        _id: {type: app.mongo.Schema.ObjectId, auto: true},
        reader: String,
        startRead: Date,
        article: Object,
        viewsQuantity: {type: Number, default: 1}
    })

    const View = app.mongo.model('views', view)
    
    
    const like = new app.mongo.Schema({
        _id: {type: app.mongo.Schema.ObjectId, auto: true},
        reader: String,
        article: Object,
        confirmed: Boolean
    },{
        timestamps: {
            createdAt: 'created_at'
        }
    })

    const Like = app.mongo.model('likes', like)
    
    
    //Schema para os comentários dos artigos
    const comment = new app.mongo.Schema({
        _id: {type: app.mongo.Schema.ObjectId, auto: true},
        userName: String,
        userEmail: String,
        comment: String,
        article: Object,
        confirmed: Boolean,
        readed: Boolean,
        answerOf: {type: Object, default: null}
    },{
        timestamps: {
            createdAt: 'created_at'
        }
    })

    const Comment = app.mongo.model('comments', comment)

    
    
    return {User, Article, Theme, Category, View, Like, Comment}
}