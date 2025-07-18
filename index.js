const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

const categories = {
  'майонез': 'https://online.metro-cc.ru/search?q=%D0%BC%D0%B0%D0%B9%D0%BE%D0%BD%D0%B5%D0%B7',
  'кетчуп':  'https://online.metro-cc.ru/search?q=%D0%BA%D0%B5%D1%82%D1%87%D1%83%D0%BF',
  'джем':    'https://online.metro-cc.ru/search?q=%D0%B4%D0%B6%D0%B5%D0%BC'
};

app.get('/parse', async (req, res) => {
  try {
    const cat = req.query.category?.toLowerCase();
    const url = categories[cat];
    if (!url) return res.status(400).json({ error: 'Unknown category' });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // если на сайте карточки подгружаются скроллом, можно делать:
    // await autoScroll(page);

    // распарсим по реальным классам
    const products = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.product-tile').forEach(card => {
        const name  = card.querySelector('.product-tile__title')?.innerText.trim();
        const price = card.querySelector('.product-tile__price')?.innerText.trim();
        if (name && price) out.push({ name, price });
      });
      return out;
    });

    await browser.close();
    return res.json(products);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('Metro Parser API'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
