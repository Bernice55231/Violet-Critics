import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const User = mongoose.model("User");
const Movie = mongoose.model('Movie');
const MovieList = mongoose.model('MovieList');
const Review = mongoose.model('Review');

router.get('/:slug', (req, res) => {
    Movie.findOne(req.params)
    .populate({
        path: "reviews",
        populate: {
            path: "user"
        },
    })
    .exec((err, movie) => {
        if(!err) {
          // console.log(result);
          if(req.user) {
            User.findOne({_id: req.user.id})
                .populate({
                    path: "starlists",
                    populate: {
                        path: "items"
                    },
                })
                .exec((err, userDetails) => {
                    if(userDetails.starlists.length > 0){
                        const starredMovies = userDetails.starlists[0].items;
                        const starredIDs = starredMovies.map(ele => ele.id);
                        if(starredIDs.includes(movie.id)) {
                            res.render("movies", {movie: movie, user: req.user, starred: true});
                        } else {
                            res.render("movies", {movie: movie, user: req.user});
                        }
                    } else {
                        res.render("movies", {movie: movie, user: req.user});
                    }
                });
          } else {
            res.render("movies", {movie: movie});
          }
        }
    });
});

router.post('/review/:slug', (req, res) => {
    console.log(req.body);
    const reviewObj = new Review({
        user: req.user.id,
        comments: req.body.review
    });
    reviewObj.save((err, savedReview) => {
        if(err) {
            console.log(err);
            res.json({success: false, message: "failed to save review"});
        } else {
            Movie.updateOne({slug: req.params.slug}, {$push: {reviews: savedReview.id}}, (err, docs) => {
                if(err) {
                    console.log(err);
                    res.json({success: false, message: "update Movie reviews failed"});
                } else {
                    console.log("Updated Docs : ", docs);
                    res.redirect(`/movies/${req.params.slug}`);
                }
            });
        }
    });
    
});

router.post('/star', (req, res) => {
    const user_id = req.user.id;
	MovieList.findOne({user: user_id}).exec((err, mvlist) => {
        if(mvlist) {
            MovieList.updateOne({_id: mvlist.id}, {$push: {items: req.body.mv_id}}, (err, docs) => {
                if (err){
                    console.log(err);
                    res.json({success: false});
                }
                else{
                    console.log("Updated Docs : ", docs);
                    res.json({success: true});
                }
            });
        } else {
            const mvlistObj = new MovieList({
                user: user_id,
				list_name: "STAR",
                items: [req.body.mv_id],
                createdAt: new Date()
            });
            mvlistObj.save((err, savedMvlist) => {
                if(err) {
                    console.log(err);
                    res.redirect('/');
                } else {
                    // console.log("savedMvlist.id:", savedMvlist.id);
                    User.updateOne({_id: user_id}, {$push: {starlists: savedMvlist.id}}, function (err, docs) {
                        if (err){
                            console.log(err);
                            res.json({success: false});
                        }
                        else{
                            console.log("Updated Docs : ", docs);
                            res.json({success: true});
                        }
                    });
                }
            });
        }
        
    });
});

export {
    router as movies
}
