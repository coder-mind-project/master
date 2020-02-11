
exports.up = function(knex) {
    return knex.schema.createTable('likes', (table) => {
        table.increments('id').primary()
        table.integer('month').unsigned()
        table.bigInteger('count').unsigned()
        table.timestamp('generated_at').defaultTo(knex.fn.now())
        table.integer('year').unsigned()
        table.string('reference')
        table.engine('InnoDB')
        table.charset('utf8mb4')
    })     
};

exports.down = function(knex) {
    return knex.schema.dropTable('likes')
};
