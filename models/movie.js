'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

//it is basically your template//

const movieSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: Boolean, required: true },
  date: { type: String, required: true },
  zip: { type: String, required: true },
  image: { type: String, required: true },
  review: { type: String, required: true }

});

//gives the functionality to interact with your databas//

const movieModel = mongoose.model('Movie', movieSchema);

module.exports = movieModel;