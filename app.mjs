import "./utils/db.mjs";
import "./utils/auth.mjs";
import { index } from "./routes/index.mjs";
import { movies } from "./routes/movies.mjs";

import passport from "passport";
import mongoose from "mongoose";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";

const User = mongoose.model("User");
const Movie = mongoose.model("Movie");
const MovieList = mongoose.model("MovieList");

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "hbs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

// // enable cookies
// app.use(cookieParser());

// set bodyparser
app.use(express.json());

// passport setup
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  if (req.user) {
    res.cookie("username", req.user.username);
  } else {
    res.clearCookie("username");
  }
  next();
});

app.use("/", index);

app.use("/movies", movies);

app.get("/starlists", (req, res) => {
  User.findOne({ _id: req.user.id })
    .populate({
        path: "starlists",
        populate: {
        path: "items"
        },
    })
    .exec((err, userDetails) => {
        const starlistsObj = {
            user: userDetails.username,
            starlists: userDetails.starlists,
        };
        res.render('starlists', starlistsObj);
    });
});

app.listen(process.env.PORT || 3000);
