import mongoose from "mongoose";
import passport from 'passport';
import LocalStrategy from 'passport-local';

const User = mongoose.model('User');

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());