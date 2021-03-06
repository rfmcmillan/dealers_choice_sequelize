const express = require('express');
const { userInfo } = require('os');
const app = express();
const path = require('path');

const {
  db,
  syncAndSeed,
  models: { Comic, Owner, Sale },
} = require('./db');

app.use(express.urlencoded({ extended: false }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use(require('method-override')('_method'));

app.get('/', async (req, res, next) => {
  try {
    const comics = await Comic.findAll();
    const owners = await Owner.findAll({
      include: [Comic],
    });
    const html = `
    <html>
      <head>
      <link href="./assets/styles.css" rel="stylesheet">
      </head>
      <body>
        <h1>COMIC DATABASE</h1>
        <div id="container">
          <div class="item">
            <h3>ENTER A NEW COMIC HERE</h3>
            <form id="container-form" method="POST" action="/comics">
              <label>TITLE:</label>
              <input name="title"></input>
              <br>
              <label>ISSUE #:</label>
              <input type="number" name="issue"></input>
              <br>
              <label>OWNER:</label>
              <input name="ownerName" placeholder="Enter New or Existing Owner Name"></input>
              <br>
              <button>Submit</button>
            </form>
          </div>
          <div class="item">
            <h3>
              <a href="/owners">OWNERS</a>
            </h3>
            <ul>
              ${owners
                .map((owner) => {
                  return `
                  <li>
                    ${owner.name}
                    <ul>
                      ${owner.comics
                        .map((comic) => {
                          return `
                        <li>${comic.title} #${comic.issue}</li>
                        `;
                        })
                        .join('')}
                    </ul>
                  </li>
                `;
                })
                .join('')}
            </ul>
          </div>
          <div class="item">
            <h3>
              <a href="/comics">COMICS</a>
            </h3>
            <ul>
              ${comics
                .map((comic) => {
                  return `
                  <li>
                    ${comic.title} #${comic.issue}
                  </li>
                `;
                })
                .join('')}
            </ul>
          </div>
        </div>
      </body>
    </html>
    `;
    res.send(html);
  } catch (error) {
    next(error);
  }
});

app.post('/comics', async (req, res, next) => {
  try {
    const newComic = await Comic.create(req.body);
    const owner = await Owner.findAll({
      where: {
        name: req.body.ownerName,
      },
    });
    if (owner.length) {
      newComic.ownerId = owner[0].id;
      newComic.save();
      res.redirect('/');
    } else {
      const newOwner = await Owner.create({ name: req.body.ownerName });
      console.log(newOwner);
      newComic.ownerId = newOwner.id;
      newComic.save();
      res.redirect('/');
    }
  } catch (err) {
    next(err);
  }
});

app.delete('/comics', async (req, res, next) => {
  const request = await req.body;
  const comic = await Comic.findByPk(req.body.comicId);
  comic.destroy();
  res.redirect('/comics');
});

app.get('/comics', async (req, res, next) => {
  try {
    const comics = await Comic.findAll({
      include: [{ model: Owner }],
    });
    const html = `
      <html>
        <head>
          <link href="./assets/styles.css" rel="stylesheet">
        <head>
        <body>
          <h1>
            <a href="/"><<</a>
          </h1>
          <h3>COMICS</h3>
            <ul>
              ${comics
                .map((comic) => {
                  return `<li>
                            ${comic.title} #${comic.issue}
                            <br>
                              - Owner: ${
                                !!comic.owner ? comic.owner.name : 'none'
                              }
                            <br>
                              - Writer: ${!!comic.writer ? comic.writer : ''}
                            <br>
                              - Artist: ${!!comic.artist ? comic.artist : ''}
                            <form method="POST" action="/comics/?_method=DELETE">
                              <button name="comicId" value="${
                                comic.id
                              }">X</button>
                            </form>
                          </li>
                          `;
                })
                .join('')}
            </ul>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    next(error);
  }
});

app.get('/owners', async (req, res, next) => {
  try {
    const owners = await Owner.findAll({
      include: [{ model: Comic }],
    });
    const html = `
      <html>
        <head>
          <link href="./assets/styles.css" rel="stylesheet">
        <head>
        <body>
          <h1>
            <a href="/"><<</a>
          </h1>
          <h3>OWNERS</h3>
            <ul>
              ${owners
                .map((owner) => {
                  return `
                  <li>${owner.name}
                    <ul>
                      ${owner.comics.map((comic) => {
                        return `
                          <li>${comic.title} #${comic.issue}</li>
                        `;
                      })}
                    </ul>
                    <form method="POST" action="/owners/?_method=DELETE">
                      <button name="ownerId" value="${owner.id}">X</button>
                    </form>
                  </li>
                  `;
                })
                .join('')}
            </ul>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    next(error);
  }
});

app.delete('/owners', async (req, res, next) => {
  try {
    const owner = await Owner.findByPk(req.body.ownerId);
    await owner.destroy();
    res.redirect('/owners');
  } catch (err) {
    next(err);
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
  try {
    await syncAndSeed();
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
  } catch (error) {
    console.log(error);
  }
};

init();
