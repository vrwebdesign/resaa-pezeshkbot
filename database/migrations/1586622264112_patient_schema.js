'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class PatientSchema extends Schema {
  up() {
    this.create('patients', (table) => {
      table.increments();
      table.string('name');
      table.string('mobile');
      table.string('email');
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps();
    });
  }

  down() {
    this.drop('patients');
  }
}

module.exports = PatientSchema;
