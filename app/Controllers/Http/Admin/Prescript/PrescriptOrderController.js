'use strict';
const Resource = use('Resource');
const Excel = use('exceljs');
const moment = require('moment-jalaali');
const fs = use('fs');
/** @type {import('lodash')} */
const _ = use('lodash');
class PrescriptOrderController extends Resource {
  constructor() {
    super();
    this.Model = use('App/Models/PrescriptOrder');
  }

  async exportExcel({ response, request }) {
    try {
      let { filters } = request.get();
      let orders = await this.Model.listOption({ filters, perPage: 10000 });
      var workbook = new Excel.Workbook();
      var worksheet = workbook.addWorksheet('prescript_orders');
      worksheet.columns = [
        { header: 'id', key: 'id', width: 15 },
        { header: 'نام', key: 'name', width: 15 },
        { header: 'موبایل', key: 'mobile', width: 12 },
        { header: 'کد ملی', key: 'nationalcode', width: 12 },
        { header: 'شهر', key: 'city', width: 11 },
        { header: 'مبلغ کل', key: 'amount', width: 11 },
        { header: 'مبلغ با بیمه', key: 'amount_with_insurance', width: 11 },
        { header: 'مبلغ ایاب و ذهاب', key: 'shipment_amount', width: 11 },
        { header: 'مبلغ پیش پرداخت', key: 'prepay_amount', width: 11 },
        { header: 'وضعیت پرداخت', key: 'transaciton_status', width: 11 },
        { header: 'تاریخ', key: 'date', width: 11 },
        { header: 'زمان', key: 'time', width: 11 },
        { header: 'توضیحات', key: 'description', width: 11 },
        { header: 'کدپیگیری درگاه', key: 'tracking_code', width: 11 },
        { header: 'نمونه گیر', key: 'sampler', width: 11 },
        { header: 'آزمایشگاه', key: 'labratory', width: 11 },
      ];
      for (let order of orders.rows) {
        worksheet.addRow({
          id: order.id,
          name: order.user_fullname,
          mobile: order.user_mobile,
          nationalcode: order.user_nationalcode,
          amount: order.amount,
          amount_with_insurance: order.amount_with_insurance,
          prepay_amount: order.prepay_amount,
          shipment_amount: order.shipment_amount,
          payable_amount: order.payable_amount,
          transaciton_status: order.$relations.transaction
            ? order.$relations.transaction.status
            : '',
          date: moment(order.created_at).format('jYYYY/jMM/jDD'),
          time: moment(order.created_at).format('HH:mm'),
          description: order.description,
          city: order.$relations.city ? order.$relations.city.name : '-',
          tracking_code: order.$relations.transaction
            ? order.$relations.transaction.tracking_code
            : '',
          sampler: order.$relations.sampler
            ? order.$relations.sampler.name
            : '',
          labratory: order.$relations.labratory
            ? order.$relations.labratory.name
            : '',
        });
      }
      fs.mkdirSync('tmp/report/', { recursive: true });
      response.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      response.header(
        'Content-Disposition',
        'attachment; filename=' + 'PrescriptReport.xlsx'
      );
      return workbook.xlsx.write(response.response);
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async flow({ request }) {
    let options = request.get();
    if (options.filters) {
      options.filters = JSON.parse(options.filters);
    } else {
      options.filters = [];
    }
    options.filters.push('transaction.status:paid');
    options.filters.push('status:canceled:<>');
    options.filters.push('status:test_result_posted:<>');
    options.filters = JSON.stringify(options.filters);
    return this.Model.listOption(options);
  }

  async changeIsCalled({ request, params: { id } }) {
    let order = await this.Model.find(id);
    let { is_called } = request.post();
    order.is_called = is_called;
    return order.save();
  }

  async changeIsNegotiated({ request, params: { id } }) {
    let order = await this.Model.find(id);
    let { is_negotiated } = request.post();
    order.is_negotiated = is_negotiated;
    return order.save();
  }

  async getCount({ request }) {
    let { filters } = request.get();
    let orders = await this.Model.listOption({ filters, perPage: 10000 });
    return _.sumBy(orders.rows, 'count');
  }

  async SendSms({ params: { id }, request }) {
    let order = await this.Model.find(id);
    await order.sendInvoice();
    return true;
  }
}
module.exports = PrescriptOrderController;
