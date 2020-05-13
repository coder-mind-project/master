/**
 * @description The collection
 */
const collection = 'views'

/**
 * @description Collection data
 */
const data = [
  {
    model: collection,
    documents: [
      {
        reader: '201.17.73.21',
        articleId: '5eb1b6b26b59f6514c1c8e0c'
      },
      {
        reader: Date.now().toString(),
        articleId: '5eb1b6b26b59f6514c1c8e0c'
      },
      {
        reader: Date.now().toString(),
        articleId: '5eb1b6b26b59f6514c1c8e0c'
      },
      {
        reader: '201.17.73.21',
        articleId: '5eb1b65ae6b68d50dd1e8b85'
      },
      {
        reader: Date.now().toString(),
        articleId: '5eb1b65ae6b68d50dd1e8b85'
      }
    ]
  }
]

module.exports = (seeder, url) => {
  seeder.connect(url, () => {
    seeder.loadModels(['./config/database/schemas/mongoose'])

    seeder.clearModels([collection], () => {
      seeder.populateModels(data, () => {
        seeder.disconnect()
      })
    })
  })
}
