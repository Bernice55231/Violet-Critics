import mongoose from "mongoose";
import * as dotenv from 'dotenv';
dotenv.config();
import mongooseSlugPlugin from 'mongoose-slug-plugin';
import passportLocalMongoose from 'passport-local-mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let dbconf;
// users
// * our site requires authentication...
// * so users have a username and password
// * they also can have 0 or more lists
const User = new mongoose.Schema({
  // username provided by authentication plugin
  // password hash provided by authentication plugin
  favgenres: [{ type: String, required: false }],
  starlists: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'MovieList', required: false },
  ],
});

// an item (or group of the same items) in a movie database
// * includes all the basic info of this movie
// * items in a list can be crossed off
const Movie = new mongoose.Schema(
  {
    title_eng: { type: String, required: true },
    name: { type: String, required: true },
    overview: { type: String, required: false},
    poster: { type: String, required: false },
    directors: [{ type: String, required: false }],
    main_actors: [{ type: String, required: false }],
    release_date: { type: String, required: true },
    genre: [{ type: String, required: true }],
    time: { type: String, required: true },
    rating: { type: Number, required: false },
    reviews: [{type: mongoose.Schema.Types.ObjectId, ref:'Review'}],
    href: { type: String, required: false }
  }
);

// an item (or group of the same items) of Review
// * includes user info and review content
const Review = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref:'User'},
  comments: {type: String, required: true}
});

// a Movie List
// * each list must have a related user
// * a list can have 0 or more items
const MovieList = new mongoose.Schema(
  {
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    list_name: { type: String, required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
    createdAt: { type: Date, required: true },
  }
);

User.plugin(passportLocalMongoose);
Movie.plugin(mongooseSlugPlugin, { tmpl: '<%=title_eng%>' });

mongoose.model("User", User);
mongoose.model("Movie", Movie);
mongoose.model("Review", Review);
mongoose.model("MovieList", MovieList);


if (process.env.NODE_ENV === 'PRODUCTION') {
  // if we're in PRODUCTION mode, then read the configration from a file
  // use blocking file io to do this...
  const fn = path.join(__dirname, '..', 'config.json');
  const data = fs.readFileSync(fn);
 
  // our configuration file will be in json, so parse it and set the
  // conenction string appropriately!
  const conf = JSON.parse(data);
  dbconf = conf.dbconf;
 } else {
  // if we're not in PRODUCTION mode, then use
  dbconf = 'mongodb://localhost/test';
}
mongoose.connect(dbconf);
