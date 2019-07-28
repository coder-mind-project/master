module.exports = app => {
    
    const { View } = app.config.mongooseModels

    const { errorView } = app.config.managementHttpResponse


    const countViewsPerArticle = async (_idArticle) => {
        try {
            const views = await View.findOne({'article._id': _idArticle}).count("id")
            return views.length > 0 ? views.reduce(item => item).id : 0
        } catch (error) {
            throw error
        }
    }

    const countViewPerMonth = async () => {

    }

    const countAllViews = async () => {

    }

    const get = async (req, res) => {
        const _idArticle = req.params.id

        try {
            if(!_idArticle) throw 'Artigo não encontrado'

            const perArticle = await countViewsPerArticle()

            return res.json({perArticle})
        } catch (error) {
            error = await errorView(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const addView = async (req, res) => {
        try {

            const view = {...req.body}
            const reader = await publicIp.v4()

            if(view.article){
                const exists = await View.findOne({reader, 'article._id': view.article._id})
                if(exists) return res.status(204).send()
            }else{
                throw 'Artigo não encontrado'
            }

            const newView = new View({
                article: view.article,
                reader,
                readTime: 0,
                startRead: new Date()
            })
            
            await newView.save().then( response => res.json(response)).catch(error => {
                throw error
            })

        } catch (error) {
            console.log(error)
            error = await errorView(error)
            return res.status(error.code).send(error.msg)    
        }
    }

    const updateView = (req, res) => {

    }
    
    
    return {get, addView, updateView}
}