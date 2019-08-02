const { firstUser } = require('../../.env')

module.exports = app => {
    
    const { User } = app.config.mongooseModels

    const start = async (req, res) => {
        try {
            const users = await User.find({})

            if(!users || users.length === 0){
                const user = new User(firstUser)

                user.save().then( response => res.json(response))
            }else{
                res.status(406).send('Este recurso não é permitido no momento')
            }

        } catch (error) {
            return res.status(500).send(error)
        }
    }

    return { start }
}