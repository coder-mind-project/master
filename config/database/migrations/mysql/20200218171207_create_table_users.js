exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.increments('id')
    table.string('name').notNullable()
    table
      .string('email')
      .notNullable()
      .unique()
    table
      .string('username')
      .notNullable()
      .unique()
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
