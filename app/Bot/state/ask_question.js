/** @type {import ('node-telegram-bot-api')} */
const bot = use('Bot');

/** @type {import ('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User');

/** @type {import ('@adonisjs/lucid/src/Lucid/Model')} */
const Speciality = use('App/Models/Speciality');

const _enum = require('../config/enum');

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env');

const CHANNEL_ID = Env.getOrFail('CHANNEL_ID');
const CHANNEL_URL = Env.getOrFail('CHANNEL_URL');
bot.on('message', async msg => {
  let user = await User.get(msg);
  if (msg.text == 'بازگشت به خانه') {
    return;
  }
  if (user.state != _enum.state.specialities) {
    return;
  }
  let speciality = await Speciality.findBy({ title: msg.text });
  if (!speciality) {
    return bot.sendMessage(msg.chat.id, 'لطفا تخصص خود را از لیست انتخاب کنید');
  }
  let is_memeber = await bot.getChatMember(CHANNEL_ID, msg.chat.id);
  if (is_memeber.status == 'left') {
    return bot.sendMessage(
      msg.chat.id,
      'برای استفاده از امکانات ربات و حمایت از پزشکان ما لطفا عضو کانال رسا شوید. با سپاس',
      {
        reply_markup: {
          inline_keyboard: [[{ text: 'عضویت در کانال', url: CHANNEL_URL }]]
        }
      }
    );
  }
  user.state = _enum.state.ask_question;
  user.question = {
    speciality: speciality.toJSON()
  };
  await User.update_redis(user);

  // doctors = _.orderBy(doctors, 'currentlyAvailable', 'desc')
  let original_user = await User.find(user.id);
  let message = `شما تخصص ${
    speciality.title
  } را انتخاب کردید \n شما می توانید ${original_user.question_count ||
    0} سوال بپرسید\n پرسش خود را بنویسید و ارسال کنید`;

  let options = {
    reply_markup: {
      keyboard: [],
      resize_keyboard: true
    }
  };

  options.reply_markup.keyboard.push([
    {
      text: 'بازگشت به خانه'
    }
  ]);
  bot.sendMessage(msg.chat.id, message, options);
});

bot.on('message', async msg => {
  let user = await User.get(msg);
  if (msg.text == 'بازگشت به خانه') {
    return;
  }
  if (user.state != _enum.state.ask_question) {
    return;
  }
  let question = msg.text;
  let message = `سوال پرسیده شده توسط شما : \n \`\`\` ${question} \`\`\` \n می باشد آیا تایید میکنید تا برای پزشک ارسال شود؟`;
  user.question.text = question;
  await User.update_redis(user);
  bot.sendMessage(msg.chat.id, message, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'بله ارسال کن', callback_data: 'send_question' },
          { text: 'تغییر متن', callback_data: 'change_text' }
        ]
      ]
    },
    parse_mode: 'Markdown'
  });
});

bot.on('callback_query', async callback => {
  if (callback.data == 'send_question') {
    bot.sendMessage(
      callback.from.id,
      'پرسش شما با موفقیت در صف قرار گرفت و برای پزشکان تخصص مرتبط ارسال میشود'
    );
  } else if (callback.data == 'change_text') {
    bot.sendMessage(callback.from.id, `پرسش خود را بنویسید و ارسال کنید`);
  }
});