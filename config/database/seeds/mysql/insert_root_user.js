const { rootUser } = require('../../../../config/environment')
exports.seed = function (knex) {
  return knex('users')
    .del()
    .then(function () {
      const { name, email, username, tagAdmin, password } = rootUser

      return knex('users').insert([
        {
          name,
          email,
          username,
          tagAdmin,
          password
        }
      ])
    })
}
