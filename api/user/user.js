'use strict';

require('dotenv').config({ path: __dirname + '/../../.env' });
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const db = require('./user-query');
const googleUser = require('./user-google');
const oneDay = 86400000; // 1000ms * 60 * 60 * 24 = prune expired entries after 1day
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const sessionStore = new MemoryStore({
    checkPeriod: oneDay
});
router.use(session({
    cookie: { maxAge: oneDay },
    store: sessionStore,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET
}));

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// A Google account's email address can change, so don't use it to identify a user. 
// Instead, use the account's ID, which you can get on the client with getBasicProfile().getId(),
// and on the backend from the sub claim of the ID token.
router.post('/login', async (request, response) => {
    const idToken = request.body.id_token;
    if (!idToken) {
        return response.status(400).send('There is no token');
    }
    
    try {
        const payload = await googleUser.verify(idToken);
        const user = googleUser.newUser(payload);

        // Save if user does not exist
        await db.saveUser(user);
        await saveSession(request, user);
        response.send(user);
    } catch (error) {
        console.log(error);
        response.status(500).send(error);
    }
});

router.patch('/update', async (request, response) => {
    const user_id = request.user.user_id;
    try {
        await db.updateUser(user_id, request.body);
        const user = await db.findUser(user_id);
        response.send(user);
    } catch (error) {
        console.log('failed to update user data');
        response.status(500).send(error);
    }
});

router.get('/logout', async (request, response) => {
    request.session.destroy((error) => {
        if (error) {
            return response.status(500);
        }
        
        console.log('session destroyed');
        response.status(200).send();
    });
});

router.get('/delete', async (request, response) => {
    const user_id = request.user.user_id;
    try {
        await db.deleteUser(user_id);
        response.redirect('../');
    } catch (error) {
        response.status(500);
    }
});

const saveSession = (request, user) => {
    request.session.uid = user.uid;
    request.session.email = user.email;
    request.session.profile_picture_url = user.profile_picture_url;
    request.session.first_name = user.first_name;
    request.session.last_name = user.last_name;
    request.session.user_role = user.user_role;
    request.session.save();
    console.log(request.session);
}

module.exports = router;