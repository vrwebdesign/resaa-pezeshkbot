'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('BaseModel');

class City extends Model {
  static get allowField() {
    return ['name', 'sort_order'];
  }
  tests(){
    return this.hasMany('App/Models/CoronaTest','id','city_id')
  }
  checkups(){
    return this.hasMany('App/Models/CheckupTest','id','city_id')
  }
}

module.exports = City;
