'use strict';

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser')

module.exports = router;

router.use(bodyParser.urlencoded({extended: false}));
router.use(bodyParser.json());

router.post('/signup', (request, response) => {
    let user = new Object();
    user = {
        email: request.body.email,
        first_name: request.body.first_name,
        last_name: request.body.last_name,
        created_at: request.body.created_at,
        user_role: request.body.user_role
    }
    console.log(user);
    response.send(user);
});

router.post('/login', (request, response) => {

});

router.get('/logout', (request, response) => {

});

router.put('/update', (request, response) => {
    
});

router.delete('/delete', (request, response) => {

});