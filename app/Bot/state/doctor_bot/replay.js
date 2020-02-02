const bot = use('DoctorBot');
/** @type {import('node-telegram-bot-api')} */
const ResaaBot = use('ResaaBot');
const axios = use('axios');
const TestAnswer = use('App/Models/TestAnswer');
bot.on('message', async msg => {
  if (!msg.reply_to_message) {
    return;
  }
  try {
    if (!msg.voice && !msg.text) {
      return bot.sendMessage(
        msg.chat.id,
        `شما تنها امکان ارسال متن و صدا را برای بیمار دارید`
      );
    }
    if (msg.voice) {
      let { data } = await axios.get(
        `https://api.telegram.org/bot${bot.token}/getFile?file_id=${msg.voice.file_id}`
      );
      msg.voice.file_path = `https://api.telegram.org/file/bot${bot.token}/${data.result.file_path}`;
    }
    let id = msg.reply_to_message.caption.replace('#', '');

    let test_answer = await TestAnswer.find(id);
    test_answer.doctor_answer = msg.text || msg.voice.file_path;
    test_answer.status = 'answered';
    test_answer.answer_type = msg.text ? 'text' : 'voice';
    await test_answer.save();
    let title = `پاسخ پزشک به آزمایش شماره ${test_answer.id}:\n\n ‼️توجه : شما نمیتوانید روی  این پیغام ریپلای کنید`;
    await test_answer.load('user');
    await ResaaBot.sendMessage(test_answer.$relations.user.chat_id, title);
    if (msg.text) {
      await ResaaBot.sendMessage(
        test_answer.$relations.user.chat_id,
        `${msg.text}`,
        {}
      );
    } else if (msg.voice) {
      const { data } = await axios.get(msg.voice.file_path, {
        responseType: 'stream'
      });
      await ResaaBot.sendVoice(test_answer.$relations.user.chat_id, data, {});
    }
    await ResaaBot.sendMessage(
      test_answer.$relations.user.chat_id,
      'لطفا رضایت خود از جواب آزمایش را از ۱ تا ۵ انتخاب کنید\n ۱ کاملا ناراضی و ۵ کاملا راضی میباشد',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1', callback_data: `test_answer:${test_answer.id}:1` },
              { text: '2', callback_data: `test_answer:${test_answer.id}:2` },
              { text: '3', callback_data: `test_answer:${test_answer.id}:3` },
              { text: '4', callback_data: `test_answer:${test_answer.id}:4` },
              { text: '5', callback_data: `test_answer:${test_answer.id}:5` }
            ]
          ]
        }
      }
    );
    test_answer.status = 'sendToClient';
    await test_answer.save();
  } catch (error) {
    console.log(error);
  }
  // send to another
});