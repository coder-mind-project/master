
exports.up = function(knex) {
    return knex.schema.createTable('comments', (table) => {
        table.increments('id').primary()
        table.integer('month').unsigned()
        table.bigInteger('count').unsigned()
        table.timestamp('generated_at')
        table.integer('year').unsigned()
        table.string('reference')
        table.engine('InnoDB')
        table.charset('utf8mb4')
    })     
};

exports.down = function(knex) {
    return knex.schema.dropTable('comments')
};
