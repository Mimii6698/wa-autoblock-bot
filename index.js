const TelegramBot = require('node-telegram-bot-api');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();

const TELEGRAM_TOKEN = '7190319586:AAFWCNB6iH8G_TcUEmUXOPsNCC7p9IUbek4';
const ADMIN_ID = '6125521829';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const client1 = new Client({
  authStrategy: new LocalAuth({ dataPath: './.data/session1' }),
  puppeteer: { headless: true, args: ['--no-sandbox'] }
});
const client2 = new Client({
  authStrategy: new LocalAuth({ dataPath: './.data/session2' }),
  puppeteer: { headless: true, args: ['--no-sandbox'] }
});

client1.on('qr', qr => {
  qrcode.toBuffer(qr).then(buf => {
    bot.sendPhoto(ADMIN_ID, buf, { caption: 'Scan QR WA 1' });
  });
});
client2.on('qr', qr => {
  qrcode.toBuffer(qr).then(buf => {
    bot.sendPhoto(ADMIN_ID, buf, { caption: 'Scan QR WA 2' });
  });
});

client1.initialize();
client2.initialize();

bot.on('message', async msg => {
  if (msg.chat.id != parseInt(ADMIN_ID)) return;
  const links = msg.text.match(/https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+/g);
  if (!links) return bot.sendMessage(msg.chat.id, 'Tolong kirim link grup WhatsApp.');

  for (const link of links) {
    const code = link.split('/').pop();
    try {
      await bot.sendMessage(ADMIN_ID, `Memproses: ${link}`);

      const g1 = await client1.acceptInvite(code);
      await client1.sendMessage(g1.id._serialized, '🌐 Pesan otomatis dari akun 1');
      const g2 = await client2.acceptInvite(code);
      await client2.groupLeave(g2.id._serialized);
      await client2.acceptInvite(code);

      bot.sendMessage(ADMIN_ID, `✅ Grup diblokir: ${link}`);
    } catch (err) {
      console.error(err);
      bot.sendMessage(ADMIN_ID, `❌ Gagal: ${link}`);
    }
  }
});

app.get('/', (req, res) => res.send('Bot aktif.'));
app.listen(3000, () => console.log('Server live.'));
