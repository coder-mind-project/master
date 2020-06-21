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
        _id: '5eb1b6b26b59f6514c1c8e0c',
        title: 'Article 1',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        _id: '5eb1b65ae6b68d50dd1e8b85',
        title: 'Article 2',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 3',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 4',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 5',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 6',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 7',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 8',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 9',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 10',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 11',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 12',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 13',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 14',
        userId: '5e6a8e15b21a69205a464eda'
      },
      {
        title: 'Article 15',
        userId: '5e6a8e15b21a69205a464eda'
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
