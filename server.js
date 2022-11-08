'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
// const verifyUser = require('./auth');
const Movie = require('./models/movie.js');
const cache = require('./cache.js');
const axios = require('axios');


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
  response.send('test request received');
});

// app.use(verifyUser);


async function getMovie(request, response, next) {
  try {
    let zip = 89521;
    let startDate = '2022-11-11';
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
    this.theatre = movieObj.showtimes[0].theatre.name;
    this.description = movieObj.shortDescription;
    this.dateTime = movieObj.showtimes[0].dateTime;
    this.genres = movieObj.genres;
    this.poster = movieObj.preferredImage.uri;
  }
}

app.get('/movies', getMovie);
app.get('/movie', handleGetmovies);
app.post('/movie', handlePostmovies);
app.delete('/movie/:movieID', handleDeletemovies);
app.put('/movie/:movieID', handlePutmovies);


async function handleGetmovies(req, res, next) {
  ///
  try {
    let moviesFromDb = await Movie.find();
    res.status(200).send(moviesFromDb);
  } catch (error) {
    next(error);
  }
}


async function handlePostmovies(req, res, next) {
  try {
    // console.log(req.user.email);
    let newMovie = await Movie.create(req.body);
    res.status(200).send(newMovie);
  } catch (error) {
    next(error);
  }
}

async function handleDeletemovies(req, res, next) {
  let id = req.params.movieID;

  try {
    await Movie.findByIdAndDelete(id);
    res.status(200).send('deleted!');
  } catch (error) {
    next(error);
  }
}

async function handlePutmovies(req, res, next) {
  let id = req.params.movieID;
  let data = req.body;
  try {
    const updatedMovie = await Movie.findByIdAndUpdate(id, data, { new: true, overwrite: true });
    res.status(201).send(updatedMovie);
  } catch (error) {
    next(error);
  }
}

app.use((error, request, response, next) => {
  response.status(500).send(error.message);
});


app.listen(PORT, () => console.log(`listening on ${PORT}`));
