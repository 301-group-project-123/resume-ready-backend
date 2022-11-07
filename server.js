'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const verifyUser = require('./auth');
const Movie = require('./models/movie.js');
const cache = require('./cache.js');


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
mongoose.connect(process.env.MONGO_URL)

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async _ => {
  console.log('We\'re connected!');
});

app.get('/test', (request, response) => {
  response.send('test request received')
})

app.use(verifyUser);


async function getMovie(request, response, next) {
  try {
    let zip = request.query.zip;
    let startDate = request.query.startDate;
    let key = zip + startDate + 'movie';
    if (cache[key] && (Date.now() - cache[key].timestamp < 50000)) {

      console.log('Cache hit');
      response.status(200).send(cache[key].data);

    } else {
      console.log('Cache miss');
      let zip = request.query.zip;
      let startDate = request.query.startDate;
      let movieUrl = `http://data.tmsapi.com/v1.1/movies/showings?startDate=${startDate}&zip=${zip}&api_key=${process.env.REACT_APP_MOVIEAPI}`;

      let movieData = await axios.get(movieUrl);

      let parsedData = movieData.data.map(movie => new Showtime(movie));

      // ** ADD API return to CACHE
      cache[key] = {
        data: parsedData,
        timestamp: Date.now()
      };

      response.status(200).send(parsedData);

    }

  } catch (error) {
    // if I have an error, this will create a new instance of the Error Object that lives in Express
    next(error);
    response.status(500).send(error.message);
  }
}

class Showtime {
  constructor(movieObj) {
    this.title = movieObj.title;
    this.theatre = movieObj.showtimes.theatre.name;
    this.description = movieObj.shortDescription;
    this.dateTime = movieObj.dateTime;
    this.genres = movieObj.genres;
    this.poster = movieObj.preferredImage.uri;
  }
}


app.get('/movies', handleGetmovies);
app.post('/movies', handlePostmovies);
app.delete('movies', handleDeletemovies);
app.put('movies', handlePutmovies);


async function handleGetmovies(req, res) {
  /// 
  try {
    const moviesFromDb = await Movie.find({ email: req.user.email });
    res.status(200).send(moviesFromDb);
  } catch (e) {
    console.error(e);
    res.status(500).send('server error');
  }
}


async function handlePostmovies(req, res) {
  try {
    console.log(req.user.email);
    const newMovie = await Movie.create({ ...req.body, email: req.user.email })
    res.status(200).send(newMovie);
  } catch (e) {
    res.status(500).send('server error');
  }
}

async function handleDeletemovies(req, res) {
  const { id } = req.params;

  try {
    await Movie.findByIdAndDelete(id);
    res.status(200).send('deleted!')
  } catch (e) {
    res.status(500).send('server error');
  }
}

async function handlePutmovies(req, res) {
  const { id } = req.params;
  try {
    const updatedMovie = await Movie.findByIdAndUpdate(id, { ...req.body, email: req.user.email }, { new: true, overwrite: true });
    res.status(200).send(updatedMovie);
  } catch (e) {
    res.status(500).send('server error');
  }
}


app.listen(PORT, () => console.log(`listening on ${PORT}`));