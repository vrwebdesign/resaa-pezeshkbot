'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('BaseModel');

class Transaction extends Model {
  static get allowField() {
    return ['amount', 'status', 'description', 'tracking_code', 'receipt'];
  }
  static get jsonFields() {
    return ['bank_response'];
  }
  static boot() {
    super.boot();
    this.addHook('afterSave', 'TransactionHook.afterSave');
    this.addTrait('ConvertToJson');
  }
}

module.exports = Transaction;
