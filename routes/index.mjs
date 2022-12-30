import express from 'express';
import passport from 'passport';
import mongoose from 'mongoose';

const router = express.Router();

const User = mongoose.model('User');
const Movie = mongoose.model('Movie');

router.get('/', (req, res) => {
    const cookies = req.get('Cookie');
    const myCookies = {};
    if(cookies !== undefined) {
        const cookieArr = cookies.split(";");
        cookieArr.map((ele) => {
            const pair = ele.trim().split("=");
            myCookies[pair[0]] = pair[1];
        });
    }
    // console.log(myCookies);
    Movie.find({}).sort('-createdAt').exec((err, movies) => {
        res.render('index', {user: myCookies.username, trendings: movies.slice(0,6),
                            movies: movies.slice(6)});
    });
});

router.get('/search', (req, res) => {
    const mvname = req.query.mvname;
    Movie.find({name: mvname}).sort('-createAt').exec((err, movies) => {
        if(movies.length === 0) {
            res.redirect('/');
        } else {
            res.render('search', {movies: movies});
        } 
    });
});

router.get('/login', (req, res) => {
    res.render('login'); 
});

router.get('/logout', (req, res) => {
    req.logOut(err => {
        if (err) { return next(err); }
        res.clearCookie('username');
        res.redirect('/');
    });
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user) => {
      if(user) {
        req.logIn(user, (err) => {
            res.cookie('username', req.user.username);
			res.redirect('/');
        });
      } else {
        res.render('login', {message:'Your login or password is incorrect.'});
      }
    })(req, res, next);
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', (req, res) => {
    const {username, password} = req.body;
  // const existingUser = await User.findOne({username: username}).exec();
  User.register(new User({username,password}), req.body.password, (err, user) => {
    if (err) {
        console.log(err);
        res.json({ error: 1, message: 'Your registration information is not valid' });
    } else {
        passport.authenticate('local')(req, res, function () {
            // res.json({ success: 1 });
            
            res.redirect('/login');
        });
    }
  });
});

export {
    router as index
}
