'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('BaseModel');

class CoronaTest extends Model {
  static get allowField() {
    return [
      'name',
      'color',
      'sort_order',
      'description',
      'city_id',
      'result_time',
      'prepay_amount',
      'total_amount',
      'shipment_amount',
      'discount_roles',
      'services',
      'description',
      'fast_option',
    ];
  }
  static get jsonFields() {
    return ['discount_roles', 'fast_option', 'services'];
  }
  static boot() {
    super.boot();
    this.addTrait('ConvertToJson');
  }
  static listOption(qs) {
    qs.withArray = ['city'].concat(qs.withArray || []);
    return super.listOption(qs);
  }
  city() {
    return this.belongsTo('App/Models/City', 'city_id');
  }
}

module.exports = CoronaTest;
