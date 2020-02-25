const { rootUser } = require('../../../../.env')
exports.seed = function(knex) {
  return knex('users')
    .del()
    .then(function() {
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
