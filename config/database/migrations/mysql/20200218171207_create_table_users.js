exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.increments('id')
    table.string('name').notNullable()
    // prettier-ignore
    table.string('email').notNullable().unique()
    // prettier-ignore
    table.string('username').notNullable().unique()
    table.string('tagAdmin').notNullable()
    table.string('password').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.engine('InnoDB')
    table.charset('utf8mb4')
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable('users')
}
