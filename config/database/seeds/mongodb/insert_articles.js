
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
        customURL: Date.now() + Math.round(Math.random() * 1000),
        author: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 2',
        customURL: Date.now() + Math.round(Math.random() * 1000),
        author: '5e6a8e15b21a69205a464eda'
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
