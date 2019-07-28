module.exports = app => {

    const { Comment } = app.config.mongooseModels

    const { exists, validateEmail, validateLength } = app.config.validation

    const get = async (req, res) => {
        try {

            /* Options allowed for type attr:
                option  -   description

                'not-readed'    -   for not readed comments
                'only-readed'   -   for only readed comments
                'all'   -   for all comments 
            */
            const type = req.query.type || 'not-readed'
            const page = parseInt(req.query.page) || 1
            const limit = parseInt(req.query.limit) || 100

            const user = req.user.user

            var result = null
            
            switch(type){
                case 'all':{
                    result = await getAllComments(user, page, limit)
                    break
                }
                case 'not-readed':{
                    result = await getNotReadedComments(user, page, limit)
                    break
                }
                case 'only-readed':{
                    result = await getOnlyReadedComments(user, page, limit)
                    break
                }
            }

            if(!result) throw 'Ocorreu um erro desconhecido, se persistir reporte'

            if(!result.status) throw result.error
            
            const comments = result.comments
            const count = result.count

            return res.json({comments, count, limit})

        } catch (error) {
            return res.status(500).send(error)
        }
    }


    const getNotReadedComments = async (user, page, limit) => {
        try {

            let count = await Comment.aggregate([
                {$match: {
                    $and: [
                        {readed: false},
                        {'article.author._id': user._id},
                        {answerOf: null}
                    ]
                }}
            ]).count("id")
            
            count = count.length > 0 ? count.reduce(item => item).id : 0

            const comments = await Comment.aggregate([
                {$match: {
                    $and: [
                        {readed: false},
                        {'article.author._id': user._id},
                        {answerOf: null}
                    ]
                }}
            ]).skip(page * limit - limit).limit(limit)

            return {comments, status: true, count, limit}
        } catch (error) {
            return {status: false, error, count: 0, limit}
        }
    }

    const getOnlyReadedComments = async (user, page, limit) => {
        try {

            let count = await Comment.aggregate([
                {$match: {
                    $and: [
                        {readed: true},
                        {'article.author._id': user._id},
                        {answerOf: null}
                    ]
                }}
            ]).count("id")
            
            count = count.length > 0 ? count.reduce(item => item).id : 0

            const comments = await Comment.aggregate([
                {$match: {
                    $and: [
                        {readed: true},
                        {'article.author._id': user._id},
                        {answerOf: null}
                    ]
                }}
            ]).skip(page * limit - limit).limit(limit)

            return {comments, status: true, count, limit}
        } catch (error) {
            return {status: false, error, count: 0, limit}
        }
    }

    const getAllComments = async (user, page, limit) => {
        try {

            let count = await Comment.aggregate([
                {$match: {
                    $and: [
                        {'article.author._id': user._id},
                        {answerOf: null}
                    ]
                }}
            ]).count("id")
            
            count = count.length > 0 ? count.reduce(item => item).id : 0

            const comments = await Comment.aggregate([
                {$match: {
                    $and: [
                        {'article.author._id': user._id},
                        {answerOf: null}
                    ]
                }}
            ]).skip(page * limit - limit).limit(limit)

            return {comments, status: true, count, limit}
        } catch (error) {
            return {status: false, error, count: 0, limit}
        }
    }

    const readComment = (req, res) => {
        try {
            const comment = {...req.body}

            if(!comment._id) throw 'Comentário não encontrado'

            Comment.updateOne({_id: comment._id}, comment).then( response => {
                if(response.nModified > 0){
                    return res.status(204).send()
                }else{
                    return res.status(410).send('Comentário já esta marcado como lido')
                }
            })
        } catch (error) {
            console.log(error)
            return res.status(500).send(error)
        }
    }

    const sendComment = async (req, res) => {
        try {
            const comment = {...req.body}
            const user = req.user.user

            validateLength(comment.comment, 1000, 'bigger', 'Para o comentário é somente permitido 1000 caracteres')

            const newComment = new Comment({
                userName: user.name,
                userEmail: user.email,
                comment: comment.answer,
                article: comment.article,
                confirmed: true,
                readed: false,
                answerOf: comment
            })

            newComment.save().then(() => res.status(201).send('Resposta salva com sucesso'))
                .catch(error => {
                    throw error
                })

        } catch (error) {
            if(typeof error === 'string') return res.status(400).send(error)
            return res.status(500).send('Ocorreu um erro desconhecido, por favor tente mais tarde')
        }
    }

    return {get, readComment, sendComment}
}