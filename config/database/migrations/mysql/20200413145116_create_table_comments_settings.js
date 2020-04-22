exports.up = function (knex) {
  return knex.schema.createTable('comment_settings', table => {
    table.increments('id')
    table.string('userId').notNullable().unique()
    table.enu('type', ['all', 'only-readed', 'not-readed', 'enabled', 'disabled']).defaultTo('all').notNullable()
    table.enu('order', ['desc', 'asc']).defaultTo('desc').notNullable()
    table.integer('limit').defaultTo(6).notNullable()
    table.boolean('notify').defaultTo(false).notNullable()
    table.enu('answers_order', ['desc', 'asc']).defaultTo('desc').notNullable()
    table.enu('answers_type', ['all', 'enabled', 'disabled']).defaultTo('all').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.engine('InnoDB')
    table.charset('utf8mb4')
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('comment_settings')
}
