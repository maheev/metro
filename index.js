const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

const categories = {
  'майонез': 'https://online.metro-cc.ru/search?text=майонез',
  'кетчуп': 'https://online.metro-cc.ru/search?text=кетчуп',
  'джем': 'https://online.metro-cc.ru/search?text=джем'
};

app.get('/parse', async (req, res) => {
  try {
    const category = req.query.category?.toLowerCase();
    const url = categories[category];
    if (!url) return res.status(400).json({ error: 'Unknown category' });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const products = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('[data-testid="product-card"]').forEach(card => {
        const name = card.querySelector('[data-testid="product-title"]')?.innerText?.trim();
        const price = card.querySelector('[data-testid="price"]')?.innerText?.trim();
        if (name && price) items.push({ name, price });
      });
      return items;
    });

    await browser.close();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Metro Parser API'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
