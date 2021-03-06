'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const Resource = use('Resource');

class InsuranceController extends Resource {
  constructor() {
    super();
    this.Model = use('App/Models/Insurance');
  }
}

module.exports = InsuranceController;
