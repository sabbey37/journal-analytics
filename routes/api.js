const express = require('express');
const router = express.Router();
const passport = require('passport');
const moment = require('moment');
const db = require('../db');
const ensureAuthenticated = require('../utils').ensureAuthenticated;
const Event = require('../models/event.js');



function dateSifter(date) {
    if (date === "0daysAgo") {
        date = moment().format('YYYY-MM-DD');
        return date;
    } else if (date === "7daysAgo") {
        date = moment().subtract(7, 'days').format('YYYY-MM-DD');
        return date;
    } else if (date === "30daysAgo") {
        date = moment().subtract(30, 'days').format('YYYY-MM-DD');
        return date;
    } else {
        return date;
    }
}

router.post('/events', ensureAuthenticated, (req, res, next) => {
    var startdate = dateSifter(req.body.startdate);
    var enddate = dateSifter(req.body.enddate);
    
    db.any(`
    SELECT evs.event_date, evs.event_id, evs.description, evs.method, evs.accountname, evs.propertyname, evs.email, evs.eventlink, evs.date_added, urs.firstname, urs.picture 
	from events evs
		inner join users urs
		on urs.email = evs.email
    where 
    	evs.event_date::date >= '${startdate}'
    	and evs.event_date::date <= '${enddate}'
    	and evs.accountid = '${req.body.accountid}'
    	and evs.propertyid = '${req.body.propertyid}'    
    	order by evs.event_date DESC;
    `)
    // Event.getByDate()
    .then(results => {
        res.send(results)
    })
    .catch((err) => {
        res.status(500).send(`<p class="event-error">Server connection error. Please try your search again later.</p>`);
    })
})

// Store larger image provided by google analytics auth
router.post('/picture', ensureAuthenticated, (req, res, next) => {
    if(!req.body) {
        return res.status(400).send('No information provided.');
    }
    db.one(`
        select picture from users where email = '${req.body.email}';
      `)
      .then((result) => {
        res.send(result);
        })
})

// Store an event in database upon form submission
router.post('/eventstore', ensureAuthenticated, function(req, res, next) {
    if(!req.body) {
        return res.status(400).send('No information provided.');
    }
    
    var description = req.body.description;
    description = description.replace("'", "''");
    var link = req.body.eventlink;
    link = link.replace("'", "''");
    var date = moment().utc(-240);
    
    db.none(`insert into events (event_date, description, method, accountname, accountid, propertyname, propertyid, email, eventlink, date_added)
        values ('${req.body.date}', '${description}', '${req.body.method}', '${req.body.accountName}', '${req.body.accountId}', '${req.body.propertyName}', '${req.body.propertyId}', '${req.user}', NULLIF('${link}',''), '${date}');
    `)
    // const event = new Event(req.body.description, req.body.eventlink, moment().utc(-240));

    // event.save()
        .then((result) => {
            res.status(202).send('<span class="status-msg">Thank you! Your event has been added.</span>');
            res.end();
        }) 

        .catch((err) => {
            res.status(500).send('<span class="status-msg">Sorry, your event could not be added at this time. Please try again later.</span>');
            res.end();
        })
})

module.exports = router;
