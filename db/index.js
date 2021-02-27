const Sequelize = require('sequelize');
const { DataTypes } = Sequelize;
const db = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/comics_db'
);

const Comic = db.define('comic', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  issue: {
    type: DataTypes.INTEGER,
  },
  writer: {
    type: DataTypes.STRING,
  },
  artist: {
    type: DataTypes.STRING,
  },
});

const Owner = db.define('owner', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

const Sale = db.define('sale', {});

Comic.belongsTo(Owner);
Owner.hasMany(Comic);
Sale.belongsTo(Comic);
Sale.belongsTo(Owner, { as: 'seller' });
Owner.hasMany(Sale, { foreignKey: 'sellerId' });
Sale.belongsTo(Owner, { as: 'buyer' });

const syncAndSeed = async () => {
  await db.sync({ force: true });
  const spiderman = await Comic.create({
    title: 'Spiderman',
    issue: 25,
    writer: 'Stan Lee',
    artist: 'Steve Ditko',
  });
  const batman = await Comic.create({
    title: 'Detective Comics',
    issue: 27,
    writer: 'Bob Kane/Bill Finger',
    artist: 'Bob Kane',
  });
  const spawn = await Comic.create({
    title: 'Spawn',
    issue: 10,
    writer: 'Todd McFarlane',
    artist: 'Todd McFarlane',
  });
  const eric = await Owner.create({ name: 'Eric' });
  const andrew = await Owner.create({ name: 'Andrew' });
  const sarah = await Owner.create({ name: 'Sarah' });
  spiderman.ownerId = eric.id;
  batman.ownerId = andrew.id;
  spawn.ownerId = sarah.id;
  await spiderman.save();
  await batman.save();
  await spawn.save();
  const sale1 = Sale.create({ comicId: 1, sellerId: 1, buyerId: 2 });
  const sale2 = Sale.create({ comicId: 2, sellerId: 2, buyerId: 1 });
  spiderman.ownerId = andrew.id;
  batman.ownerId = eric.id;
  await spiderman.save();
  await batman.save();
};

module.exports = { db, syncAndSeed, models: { Comic, Owner, Sale } };
