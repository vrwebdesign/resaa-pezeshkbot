'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class AddIsForceToOrderSchema extends Schema {
  up() {
    this.table('corona_orders', (table) => {
      // alter table
      table.boolean('is_fast').defaultTo('false').after('selected_test');
    });
  }

  down() {
    this.table('corona_orders', (table) => {
      // reverse alternations
      table.dropColumn('is_fast');
    });
  }
}

module.exports = AddIsForceToOrderSchema;
