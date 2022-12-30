import axios from "axios";
import * as dotenv from 'dotenv';
import './db.mjs';
import path from "path";
import { fileURLToPath } from "url";
import * as fs from 'fs';
import mongoose from 'mongoose';
dotenv.config();

const baseURL = process.env.API_BASE_URL;
const discoverURL = baseURL + process.env.DISCOVER;
const detailURL = baseURL + process.env.MOVIE;
const apiKey = process.env.API_SECRET_KEY;
const imgURL = process.env.IMG_BASE_URL;

const Movie = mongoose.model("Movie");

function saveMovies(detailedMovies, filteredCredits) {
    for(let i = 0; i < detailedMovies.length; i++) {
        const mv = detailedMovies[i];
        const cd = filteredCredits[i];
        const movie = new Movie({
            title_eng: mv.title,
            name: mv.original_title,
            overview: mv.overview,
            poster: `https://image.tmdb.org/t/p/original${mv.poster_path}`,
            directors: cd.directors,
            main_actors: cd.actors,
            release_date: mv.release_date,
            genre: mv.genres.map(ele => ele.name),
            time: mv.runtime,
            rating: mv.vote_average,
            href: mv.homepage
        });
        movie.save((err, savedMovie) => {
            if (err) {
                console.log(mv.original_title);
                console.log("[ERROR]: Save record error", err);
                return;
            }
            console.log(`[INFO] Saved Movie id: ${savedMovie._id}`);
        });
    }
}
async function getMovies(page) {
    try {
        const simpleMovies = await axios.get(`${discoverURL}?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=${page}&with_watch_monetization_types=flatrate`);

        const moviesArr = simpleMovies.data.results;
        const movies = await Promise.all(moviesArr.map(ele => {
            return axios.get(`${detailURL}/${ele.id}?api_key=${apiKey}`);
        }));
        const detailedMovies = movies.map(ele => ele.data);
        const credits = await Promise.all(detailedMovies.map(ele => {
            return axios.get(`${detailURL}/${ele.id}/credits?api_key=${apiKey}`);
        }));
        const filteredCredits = credits.map((ele) => {
            const data = ele.data;
            const obj = {actors: [], directors: []};
            obj.actors.push(...data.cast.slice(0,5).map(ele => ele.name));
            const directors = data.crew.filter(ele => ele.known_for_department == "Directing");
            // console.log(directors);
            obj.directors.push(...directors.map(ele => ele.name));
            return obj;
        });
        let dbconf;
        if (process.env.NODE_ENV === 'PRODUCTION') {
            // if we're in PRODUCTION mode, then read the configration from a file
            // use blocking file io to do this...
            const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
        console.log(dbconf);
        await mongoose.connect(dbconf);
        console.log('successful');
        saveMovies(detailedMovies, filteredCredits);
    } catch (err) {
        console.log(err);
    } 
}

getMovies(3);
