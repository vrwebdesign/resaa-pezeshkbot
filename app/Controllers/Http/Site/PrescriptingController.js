'use strict';
const Insurance = use('App/Models/Insurance');
const City = use('App/Models/City');
const PrescriptTest = use('App/Models/PrescriptTest');
const PrescriptOrder = use('App/Models/PrescriptOrder');
const PrescriptDiscount = use('App/Models/PrescriptDiscount');
const Transaction = use('App/Models/Transaction');
const axios = require('axios');
const Env = use('Env');
class PrescriptingController {
  async insurances() {
    return Insurance.query()
      .where({ is_deleted: false })
      .orderBy('sort_order', 'ASC')
      .fetch();
  }

  async cities() {
    return City.query()
      .where({ is_deleted: false })
      .orderBy('sort_order', 'ASC')
      .fetch();
  }

  async tests({ request }) {
    let { keyword, page = 1, perPage = 10 } = request.get();
    let query = PrescriptTest.query()
      .where({ is_deleted: false })
      .orderBy('sort_order', 'ASC');

    if (keyword) {
      query = query.where('name', 'like', `%${keyword}%`);
    }

    return query.paginate(page, perPage);
  }

  async createOrder({ request }) {
    let data = request.only([
      'user_mobile',
      'user_address',
      'user_fullname',
      'user_nationalcode',
      'images',
      'city_id',
      'insurance_id',
      'discount',
    ]);
    if (data.discount && data.discount.amount) {
      let discount = await PrescriptDiscount.findBy({
        code: data.discount.code,
      });
      if (discount) {
        data.discount = discount.toJSON();
      } else {
        delete data.discount;
      }
    }
    return PrescriptOrder.create(data);
  }

  async showOrder({ params: { guid } }) {
    return PrescriptOrder.query()
      .where({ guid })
      .where({ is_deleted: false })
      .with('city')
      .with('insurance')
      .with('labratory')
      .with('sampler')
      .firstOrFail();
  }

  async callback({ request, response }) {
    let { requestId } = request.post();
    let corona_order = await PrescriptOrder.query()
      .where({ guid: requestId })
      .with('transaction')
      .with('city')
      .setVisible([
        'guid',
        'user_fullname',
        'selected_test',
        'created_at',
        'total_amount',
        'prepay_amount',
        'role_discount_amount',
        'discount',
        'payable_amount',
      ])
      .first();
    // await corona_order.loadMany(['transaction', 'city']);
    return corona_order;
  }

  async paymentRequest({ response, params: { guid } }) {
    let order = await PrescriptOrder.query().where({ guid }).firstOrFail();
    let transaction = await Transaction.create({
      amount: order.prepay_amount,
      order_id: order.id,
    });
    order.transaction_id = transaction.id;
    await transaction.save();
    await order.save();
    let { data } = await axios.post(
      'https://sep.shaparak.ir/MobilePG/MobilePayment',
      {
        Action: 'Token',
        Amount: +transaction.amount * 10,
        TerminalId: Env.get('SAMAN_TERMINAL_ID'),
        ResNum: order.guid,
        RedirectUrl: Env.get('BANK_RETURN_URL'),
      }
    );
    if (data.status == 1) {
      return response.status(200).json({
        token: data.token,
        address: 'https://sep.shaparak.ir/MobilePG/MobilePayment',
      });
    } else {
      response.status(400).json(data);
    }
  }

  async checkDiscount({ request }) {
    let { code } = request.post();
    return PrescriptDiscount.query()
      .where({ is_deleted: false })
      .where({ code })
      .firstOrFail();
  }
}

module.exports = PrescriptingController;
