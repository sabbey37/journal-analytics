var express = require('express');
var router = express.Router();
const passport = require('passport');
const db = require('../db');
const ensureAuthenticated = require('../utils').ensureAuthenticated;


router.get('/', ensureAuthenticated, function(req, res, next) { 
    db.one(`select firstname, picture from users where email = '${req.user}'`)
        .then((result) => {
            res.render('users', {
                title: 'Journal Analytics',
                navmessage: 'Welcome, ',
                navuser: '/users',
                name: result.firstname,
                pic: result.picture,
                navlink3: '/teammembers',
                navlinktext3: 'Team Management',
                navlink2: '/eventlist',
                navlinktext2: 'Team Events',
                datatype1: 'logout',
                navlink1: '/logout',
                navlinktext1: 'Logout'
                });
            })
        .catch((error) => {
            res.redirect('/login');
        })
}) 

router.post('/profile', function(req, res, next) {
    if(!req.body) {
        return res.status(400).send('No files were uploaded.');
    }
    db.one(`
        update users set picture = '${req.body.imageUrl}'
        where users.email = '${req.body.email}';
        select * from users where email = '${req.body.email}';
      `)
        
        .catch((err) => {
            console.log(err);
            res.render('error', {
                message: err.message
            })
        }) 
})

module.exports = router;
