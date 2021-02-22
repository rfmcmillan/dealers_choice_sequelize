const express = require('express');
const app = express();

const {
  db,
  syncAndSeed,
  models: { Comic, Owner, Sale },
} = require('./db');

app.get('/comics', async (req, res, next) => {
  const comics = await Comic.findAll({
    include: [{ model: Owner }],
  });
  res.send(comics);
});

app.get('/owners', async (req, res, next) => {
  const owners = await Owner.findAll({
    include: [{ model: Comic }],
  });
  res.send(owners);
});

app.get('/sales', async (req, res, next) => {
  const sales = await Sale.findAll({
    include: [
      { model: Comic, as: 'comic' },
      { model: Owner, as: 'seller' },
      { model: Owner, as: 'buyer' },
    ],
  });
  res.send(sales);
});

const init = async () => {
  await syncAndSeed();
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
