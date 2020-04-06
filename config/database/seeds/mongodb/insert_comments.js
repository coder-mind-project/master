
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
        userName: 'Mike',
        userEmail: 'mike@greatguy.com',
        message: 'I love it!',
        articleId: '5e8a96c972ebb57348d12e9d'
      },
      {
        userName: 'Jake',
        userEmail: 'jake@greatguy.com',
        message: 'I hate it!',
        articleId: '5e8a96c972ebb57348d12e9d'
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
