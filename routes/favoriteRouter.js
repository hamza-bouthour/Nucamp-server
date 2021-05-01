const express = require('express');
const Favorite = require('../models/favorite');
const Campsite = require('../models/campsite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
    .populate('campsites')
    .populate('user')
    .then(favorites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    })
    .catch(err => next(err))
   
})
.post(cors.corsWithOptions, (req, res, next) => {
    console.log(req.body)
    Favorite.findOne({user: req.user._id})
    .then(favorite => {
        if(favorite) {
            req.body.filter(campsite => !favorite.campsites.includes(campsite._id))
            .forEach(camp => favorite.campsites.push(camp))
            favorite.save();
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
        } else {
            Favorite.create({user: req.user._id})
            .then(favorite => {
                req.body.forEach(campsite => favorite.campsites.push(campsite._id))
                favorite.save()
                console.log('Campsites added to your favorite list')
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.json(favorite);
            })
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, (req, res, next) => {
    Favorite.findOneAndDelete({user: req.user._id})
    .then(favorite => {
        if (favorite) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite)
        }
        else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('You do not have any favorites to delete')
        }
    })
    .catch(err => next(err));
})


favoriteRouter.route('/:campsiteId')
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported');
})
.post(cors.corsWithOptions, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsite =>
        Favorite.findOne({user: req.user._id})
        .then(favorite => {
                if (!favorite) {
                    Favorite.create({user: req.user._id})
                    .then(favorite => {
                        favorite.campsites.push(campsite._id)
                        res.statusCode = 200
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
                }
                if (favorite) {
                    if (!favorite.campsites.includes(campsite._id)) {
                        favorite.campsites.push(campsite._id)
                        favorite.save()
                        res.statusCode = 200
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    }
                    else {

                        res.statusCode = 200
                        res.setHeader('Content-Type', 'application/json');
                        res.send('That campsite is already in the of favorites!');
                    }
                }
        })
        .catch(err => next(err))
    )
    .catch(err => {
        res.send('Campsite not found')
        next(err)  
    })
})
.put(cors.corsWithOptions, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/campsite');
})
.delete(cors.corsWithOptions, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorite => {
        if (favorite) {
            let index = favorite.campsites.indexOf(req.params.campsiteId);
            index > -1 ? favorite.campsites.splice(index, 1): console.log('campsite not found')
            favorite.save()
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
        }
        else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('No favorites to delete')
        }
    })
    .catch(err => next(err));
});



module.exports = favoriteRouter;