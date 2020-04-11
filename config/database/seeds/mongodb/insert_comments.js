
/**
 * @description The collection
 */
const collection = 'comments'

/**
 * @description Collection data
 */
const data = [
  {
    model: collection,
    documents: [
      {
        _id: '5e8b4e951394cc28c05d86ca',
        userName: 'Mike',
        userEmail: 'allan.codermind@gmail.com',
        message: 'I love it!',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Jackson',
        userEmail: 'jackson@codermind.com.br',
        message: 'I love it!',
        articleId: '5e8b551eecac6a31d6020048'
      },
      {
        userName: 'Jake',
        userEmail: 'jake@codermind.com.br',
        message: 'I hate it!',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Petter',
        userEmail: 'petter@codermind.com.br',
        message: 'I love it!',
        articleId: '5e8b551eecac6a31d6020048'
      },
      {
        userName: 'Chris',
        userEmail: 'chris@codermind.com.br',
        message: 'I hate it!',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Petter',
        userEmail: 'petter@codermind.com.br',
        message: 'I love it',
        articleId: '5e8b551eecac6a31d6020047',
        answerOf: '5e8b4e951394cc28c05d86ca'
      },
      {
        userName: 'Jack',
        userEmail: 'jack@codermind.com.br',
        message: 'I love it',
        articleId: '5e8b551eecac6a31d6020047',
        answerOf: '5e8b4e951394cc28c05d86ca'
      }
    ]
  }
]

module.exports = (seeder, url) => {
  seeder.connect(url, () => {
    seeder.loadModels([
      './config/database/schemas/mongoose'
    ])

    seeder.clearModels([collection], () => {
      seeder.populateModels(data, () => {
        seeder.disconnect()
      })
    })
  })
}
