'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class AddDescTestSchema extends Schema {
  up() {
    this.table('corona_tests', (table) => {
      table.json('fast_option').after('description');
      // alter table
    });
  }

  down() {
    this.table('corona_tests', (table) => {
      table.dropColumn('fast_option');
      // reverse alternations
    });
  }
}

module.exports = AddDescTestSchema;
