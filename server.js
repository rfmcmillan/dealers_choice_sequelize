const express = require('express');
const app = express();

const {
  db,
  syncAndSeed,
  models: { Comic, Owner, Sale },
} = require('./db');

app.use(express.urlencoded({ extended: false }));

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
      </head>
      <body>
        <h1>Russel's Comic Database</h1>
        <div>
          <h3>Enter a New Comic Here</h3>
          <form method="POST" action="/comics">
            <label>Title:</label>
            <input name="title"></input>
            <br>
            <label>Issue #:</label>
            <input type="number" name="issue"></input>
            <br>
            <label>Owner</label>
            <input name="ownerName"></input>
            <br>
            <button>Submit</button>
          </form>
        </div>
        <div>
          <h3>
            Owners
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
        <div>
          <h3>Comics</h3>
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
      </body>
    </html>
    `;
    res.send(html);
  } catch (error) {
    next(error);
  }
});

app.post('/comics', async (req, res, next) => {
  const newComic = await Comic.create(req.body);
  const owner = await Owner.findAll({
    where: {
      name: req.body.ownerName,
    },
  });
  console.log(owner[0].id);
  newComic.ownerId = owner[0].id;
  newComic.save();
  res.redirect('/');
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
        <head>
        <body>
          <h1>Comics</h1>
            <ul>
              ${comics
                .map((comic) => {
                  return `<li>
                            ${comic.title} #${comic.issue}
                            <br>
                              - Owner: ${
                                !!comic.owner ? comic.owner.name : 'none'
                              }
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
        <head>
        <body>
          <h1>Owners</h1>
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
