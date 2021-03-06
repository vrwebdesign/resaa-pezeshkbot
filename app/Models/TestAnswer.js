'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('BaseModel');

/** @type { import('axios')} */
const axios = require('axios');

/** @type { import('@adonisjs/framework/src/Env')} */
const Env = use('Env');

const BASE_API = Env.getOrFail('RESAA_API');

/** @type {typeof import('moment')} */
const moment = use('moment');

const fs = use('fs');

class TestAnswer extends Model {
  static boot() {
    super.boot();
    this.addHook('beforeCreate', 'TestAnswerHook.beforeCreate');
    this.addTrait('ConvertToJson');
  }
  static get allowField(){
    return ['description']
  }
  static get hidden() {
    return ['doctor_answer'];
  }
  static get jsonFields() {
    return ['files', 'doctor', 'doctor_answer'];
  }
  static listOption(qs) {
    qs.withArray = ['user'].concat(qs.withArray || []);
    return super.listOption(qs);
  }
  static send({ user, doctor, price }) {
    const bot = use('DoctorBot');
    if (process.env.NODE_ENV == 'development') {
      doctor.chat_id = 96852497;
    }
    return new Promise(async (resolve, reject) => {
      if (!user.files || !user.files.length) {
        return reject(
          'شما فایلی برای ارسال ندارید لطفا مراحل ارسال جواب آزمایش را مجددا طی کنید'
        );
      }
      let testAnswer = await TestAnswer.create({
        doctor_chat_id: doctor.chat_id,
        price,
        doctor: doctor,
        user_id: user.id,
        files: user.files,
      });
      user.photo = [];
      try {
        for (const file of user.files) {
          let name = `./tmp/test_answer/${Date.now()}.png`;
          let { data } = await axios.get(file, {
            responseType: 'stream',
          });
          data.pipe(fs.createWriteStream(name));
          // let photo = fs.createReadStream(name)
          user.photo.push(name.replace('./', '/').replace('tmp', 'download'));
          await bot.sendPhoto(doctor.chat_id, data, {
            caption: `#${testAnswer.id}`,
          });
        }
        testAnswer.files = user.photo;
        testAnswer.status = 'sendToDoctor';
        await testAnswer.save();
        resolve({ tracking_code: testAnswer.id });
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }
  static confirm(doctor_id, testAnswer_id, user) {
    return new Promise(async (resolve, reject) => {
      try {
        let { data } = await axios.post(
          `${BASE_API}/Doctors/${doctor_id}/DiagnosticDocumentsService/Invoice?patientPhoneNumber=${user.phone}`,
          {
            requestsCount: 1,
            referenceNumber: testAnswer_id,
          }
        );
        let test_answer = await TestAnswer.find(testAnswer_id);
        test_answer.is_confirm = true;
        await test_answer.save();
        resolve(data);
      } catch (error) {
        console.log(error);
        reject('خطایی رخ داده است');
      }
    });
  }
  static async reply(id, msg) {
    let test_answer = await this.find(id);
    test_answer.status = 'answered';
    if (msg.text) {
      test_answer.doctor_answer.push({ text: msg.text, type: 'text' });
    } else if (msg.voice) {
      test_answer.doctor_answer.push({ voice: msg.voice, type: 'voice' });
    } else if (msg.photo) {
      test_answer.doctor_answer.push({ photo: msg.photo, type: 'photo' });
    } else if (msg.document) {
      test_answer.doctor_answer.push({
        document: msg.document,
        type: 'document',
      });
    }
    test_answer.answer_at = moment().second(0).format('YYYY-MM-DD HH:mm');
    await test_answer.save();
  }
  user() {
    return this.belongsTo('App/Models/User');
  }
}
[{ text: 'اینم یه تکست', type: 'text' }];
module.exports = TestAnswer;
