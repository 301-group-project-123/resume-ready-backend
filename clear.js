require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL);

const movie = require('./models/movieModel.js');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async _ => {
  console.log('We\'re connected!');
  await movie.deleteMany({});
  db.close();
});