exports.up = function(knex) {
  return knex.schema.createTable("redeem_account_requests", table => {
    table.increments("id");
    table.string("contact_email").notNullable();
    table.string("cpf");
    table.string("celphone");
    table.string("public_profile").notNullable();
    table.string("date_begin");
    table.text("msg", "longtext");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.engine("InnoDB");
    table.charset("utf8mb4");
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("redeem_account_requests");
};
