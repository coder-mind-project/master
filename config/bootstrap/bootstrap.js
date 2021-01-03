const { rootUser } = require('../environment')

function logger(message) {
  // eslint-disable-next-line no-console
  console.log(`Bootstrap - ${new Date().toLocaleString()}: ${message}`)
}

async function bootstrap(app) {
  const { User } = app.config.database.schemas.mongoose

  logger('Searching users in database...')
  const usersCount = await User.countDocuments()

  if (usersCount) {
    const createdRoot = await User.findOne({ _id: rootUser._id })

    if (createdRoot) {
      if (usersCount > 1) {
        User.deleteOne({ _id: rootUser._id }).then(() => logger('Root user removed'))
      } else {
        logger('Only root user is created, create a new user to remove user root.')
      }
    } else {
      logger('Already exists users in database. Nothing to do.')
    }
  } else {
    const user = new User({
      _id: rootUser._id,
      name: rootUser.name,
      email: rootUser.email,
      gender: 'undefined',
      tagAuthor: null,
      tagAdmin: rootUser.tag,
      password: rootUser.pass,
      customUrl: Date.now()
    })

    user.save().then(() => logger('Root user created'))
  }
}

module.exports = bootstrap
