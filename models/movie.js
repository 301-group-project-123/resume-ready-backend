'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

//it is basically your template//

const movieSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  email:  {type: String},
  status: { type: Boolean, required: false },
  dateTime: { type: String, required: true },
  theatre: { type: String, required: true },
  poster: { type: String, required: true },
  review: { type: String, required: false },


});

//gives the functionality to interact with your databas//

const movieModel = mongoose.model('Movie', movieSchema);

module.exports = movieModel;
