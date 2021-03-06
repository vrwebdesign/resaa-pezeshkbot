/** @type {import ('node-telegram-bot-api')} */
const bot = use('PezeshkBot');

/** @type {import ('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User');

/** @type {import ('@adonisjs/lucid/src/Lucid/Model')} */
const Doctor = use('App/Models/Doctor');

/** @type {import ('@adonisjs/lucid/src/Lucid/Model')} */
const Question = use('App/Models/Question');

/** @type {import ('@adonisjs/lucid/src/Lucid/Model')} */
const DoctorAnswer = use('App/Models/DoctorAnswer');

const _enum = require('./enum');

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env');

/** @type {import('@adonisjs/framework/src/Logger')} */
const Logger = use('Logger');

const SITE_URL = Env.getOrFail('SITE_URL');

const PEZESHK_BOT_TOKEN = Env.getOrFail('PEZESHK_BOT_TOKEN');

const axios = use('axios');

/** @type {import('fs')} */
const fs = use('fs');
bot.on('message', async (msg) => {
  if (!msg.reply_to_message) {
    return;
  }
  let doctor = await Doctor.findBy({ chat_id: msg.chat.id });
  if (!doctor) {
    return;
  }
  try {
    if (!msg.voice && !msg.text) {
      return bot.sendMessage(
        msg.chat.id,
        `شما تنها امکان ارسال متن و صدا را برای بیمار دارید`
      );
    }
    let doctor_answer = await DoctorAnswer.query()
      .where({ message_id: msg.reply_to_message.message_id })
      .with('question', (builder) => builder.with('user'))
      .with('doctor', (builder) => builder.with('speciality'))
      .first();
    let doctor_answer_json = doctor_answer.toJSON();
    let caption = `سوال شما توسط دکتر ${doctor_answer_json.doctor.first_name} ${
      doctor_answer_json.doctor.last_name
    } متخصص ${
      doctor_answer_json.doctor.speciality.title
    } پاسخ داده شد. در صورت تمایل می توانید با مراجعه به پروفایل ایشان در سامانه رسا به آدرس زیر مراجعه کرده و به صورت تلفنی از ایشان مشاوره بگیرید.${
      doctor_answer_json.doctor.description
        ? '\n\n' + doctor_answer_json.doctor.description
        : ''
    } \n\nhttps://resaa.net/doctors/${
      doctor_answer_json.doctor.subscriber_number
    }\n\nپرسش شما و پاسخ پزشک در پیام زیر.`;
    let image = fs.createReadStream(
      doctor_answer_json.doctor.image.replace('/api/download', './tmp/uploads')
    );
    await bot.sendPhoto(doctor_answer_json.question.user.chat_id, image, {
      caption: caption,
    });
    let message = `سوال پرسیده شده توسط شما : \n${doctor_answer_json.question.text}`;
    await bot.sendMessage(doctor_answer_json.question.user.chat_id, message);
    if (msg.voice) {
      let { data } = await axios.get(
        `https://api.telegram.org/bot${PEZESHK_BOT_TOKEN}/getFile?file_id=${msg.voice.file_id}`
      );
      msg.voice.file_path = `https://api.telegram.org/file/bot${PEZESHK_BOT_TOKEN}/${data.result.file_path}`;
      doctor_answer.answer = msg.voice.file_path;
      const { data: voice } = await axios.get(msg.voice.file_path, {
        responseType: 'stream',
      });
      await bot.sendVoice(doctor_answer_json.question.user.chat_id, voice, {
        caption: 'پاسخ پزشک',
      });
    } else {
      doctor_answer.answer = msg.text;
      await bot.sendMessage(
        doctor_answer_json.question.user.chat_id,
        ` پاسخ پزشک:\n${msg.text}`
      );
    }

    bot.sendMessage(
      msg.chat.id,
      'پاسخ شما با موفقیت برای بیمار ارسال شد، سپاس',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'برای امروز کافیه', callback_data: 'enough' },
              { text: 'سوال بعدی', callback_data: 'next_question' },
            ],
          ],
        },
      }
    );
    await doctor_answer.save();
  } catch (error) {
    Logger.error(error);
    bot.sendMessage(msg.chat.id, 'خطایی رخ داده است');
  }
});

bot.on('callback_query', async (callback) => {
  if (callback.data == 'enough') {
    return bot.sendMessage(
      callback.from.id,
      ' تشکر  و خسته نباشید بابت وقتی که برای بیماران رسا گذاشتید'
    );
  }
  if (callback.data == 'next_question') {
    let doctor = await Doctor.findBy({ chat_id: callback.from.id });
    let no_answer_question = await DoctorAnswer.query()
      .where({ is_expired: 0 })
      .whereNull('answer')
      .whereHas('doctor', (builder) =>
        builder.where({ chat_id: doctor.chat_id })
      )
      .first();

    if (no_answer_question) {
      return bot.sendMessage(
        doctor.chat_id,
        'شما به این سوال هنوز پاسخ نداده اید',
        {
          reply_to_message_id: no_answer_question.message_id,
        }
      );
    }
    let question = await Question.query()
      .where({ speciality_id: doctor.speciality_id })
      .whereDoesntHave('answer', (builder) => {
        builder
          .where((builder) =>
            builder.where({ is_expired: 0 }).whereNull('answer')
          )
          .orWhereNotNull('answer');
      })
      .first();
    if (!question) {
      return bot.sendMessage(
        doctor.chat_id,
        'سوالات مربوط به تخصص شما تمام شده است'
      );
    }
    let message = await bot.sendMessage(
      doctor.chat_id,
      `${question.text}\n\n ℹ️ℹ️ برای پاسخ به این پرسش کافیست بر روی آن ریپلای کنید ℹ️ℹ️`
    );
    await DoctorAnswer.create({
      question_id: question.id,
      doctor_id: doctor.id,
      message_id: message.message_id,
    });
  }
});
