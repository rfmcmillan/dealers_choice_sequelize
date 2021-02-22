const express = require('express');
const app = express();

const {
  db,
  syncAndSeed,
  models: { Comic, Owner, Sale },
} = require('./db');

app.get('/', async (req, res, next) => {
  try {
    res.send("Russel's Comic Database");
  } catch (error) {
    next(error);
  }
});

app.get('/comics', async (req, res, next) => {
  try {
    const comics = await Comic.findAll({
      include: [{ model: Owner }],
    });
    res.send(comics);
  } catch (error) {
    next(error);
  }
});

app.get('/owners', async (req, res, next) => {
  try {
    const owners = await Owner.findAll({
      include: [{ model: Comic }],
    });
    res.send(owners);
  } catch (error) {
    next(error);
  }
});

app.get('/sales', async (req, res, next) => {
  try {
    const sales = await Sale.findAll({
      include: [
        { model: Comic, as: 'comic' },
        { model: Owner, as: 'seller' },
        { model: Owner, as: 'buyer' },
      ],
    });
    res.send(sales);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  await syncAndSeed();
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
