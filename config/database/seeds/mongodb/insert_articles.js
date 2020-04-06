
/**
 * @description The collection
 */
const collection = 'articles'

/**
 * @description Collection data
 */
const data = [
  {
    model: collection,
    documents: [
      {
        title: 'Article 1',
        customURL: Date.now() + Math.round(Math.random() * 1000)
      },
      {
        title: 'Article 2',
        customURL: Date.now() + Math.round(Math.random() * 1000)
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
