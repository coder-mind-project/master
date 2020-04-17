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
        message: 'I hate it!',
        articleId: '5e8b551eecac6a31d6020048'
      },
      {
        userName: 'Jake',
        userEmail: 'jake@codermind.com.br',
        message: 'Indifferent...',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Petter',
        userEmail: 'petter@codermind.com.br',
        message: 'Boring!!',
        articleId: '5e8b551eecac6a31d6020048'
      },
      {
        userName: 'Chris',
        userEmail: 'chris@codermind.com.br',
        message: 'Dude, she is so into you!',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Petter',
        userEmail: 'petter@codermind.com.br',
        message: 'I hate parking my car',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Mike',
        userEmail: 'mike@codermind.com.br',
        message: 'Come on man, face me!',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Everton',
        userEmail: 'everton@codermind.com.br',
        message: 'Im the biggest in Liverpool',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Catiuscia',
        userEmail: 'catiuscia@codermind.com.br',
        message: '5x5 matrix in 5 seconds...',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Hermes',
        userEmail: 'hermes@codermind.com.br',
        message: 'Its Marshal for you!',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Tommy',
        userEmail: 'tommy@codermind.com.br',
        message: 'Vercetti, lets go!',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Karen',
        userEmail: 'karen@codermind.com.br',
        message: 'We are going to die?!?!?!',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Andreas',
        userEmail: 'andreas@codermind.com.br',
        message: 'Las venturas its my best place',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'James',
        userEmail: 'james@codermind.com.br',
        message: 'I dont know what to type here... ',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'kraken',
        userEmail: 'kraken@codermind.com.br',
        message: 'Urhhhggg Arghhhhgh',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Clop',
        userEmail: 'clop@codermind.com.br',
        message: 'What?? My name is ... Clop?? What the f@#ck',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Niaomi',
        userEmail: 'niaomi@codermind.com.br',
        message: 'Great, can i go now?',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Bastian',
        userEmail: 'seb@codermind.com.br',
        message: 'I doubt you spell my last name ;D',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Carl',
        userEmail: 'cj@codermind.com.br',
        message: 'Ohh shit, here we go again',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Victor',
        userEmail: 'victor@codermind.com.br',
        message: 'Vance! Same the Vance of Lance Vance!',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Nico',
        userEmail: 'nico@codermind.com.br',
        message: 'I doubt you find out what that means',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'Claude',
        userEmail: 'speed@codermind.com.br',
        message: '...',
        articleId: '5e8b551eecac6a31d6020047'
      },
      {
        userName: 'master',
        userEmail: 'codermind@codermind.com.br',
        message: 'Ohh my god, im the master user?',
        articleId: '5e8b551eecac6a31d6020047'
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
