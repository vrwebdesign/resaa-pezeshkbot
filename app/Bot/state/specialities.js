/** @type {import('node-telegram-bot-api')} */
const bot = use('Bot');
const _enum = require('../config/enum');
const Speciality = use('App/Models/Speciality');
const User = use('App/Models/User');
bot.onText(_enum.regex_state.specialities, async msg => {
  try {
    let user = await User.get(msg);
    user.state = _enum.state.specialities;
    await User.update_redis(user);
    let message = `لطفا تخصص خود را از لیست انتخاب کنید`;
    let options = {
      reply_markup: {
        keyboard: [],
        resize_keyboard: true
      }
    };
    let specialities = await Speciality.get();
    specialities.forEach((item, index) => {
      let text = `${item.title}`;
      if (index % 2 === 0) {
        options.reply_markup.keyboard.push([
          {
            text
          }
        ]);
      } else {
        let i = Math.ceil(index / 2) - 1;
        options.reply_markup.keyboard[i].push({
          text
        });
      }
    });
    options.reply_markup.keyboard.push([
      {
        text: 'بازگشت به خانه'
      }
    ]);

    bot.sendMessage(msg.chat.id, message, options);
  } catch (error) {
    console.error(error);
  }
});
