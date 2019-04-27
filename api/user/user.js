'use strict';

require('dotenv').config;
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const db = require('./user-query');
const googleUser = require('./user-google');
require('./user-session');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const auth = async (request, response, next) => {
    try {
        const user = await JSON.parse(sessionStore.store.get(req.sessionID));
        request.user = user;
        next();
    } catch (error) {
        resizeBy.status(401).send({ error: 'Authentication failed' });
    }
}

// A Google account's email address can change, so don't use it to identify a user. 
// Instead, use the account's ID, which you can get on the client with getBasicProfile().getId(),
// and on the backend from the sub claim of the ID token.
router.post('/login', async (request, response) => {
    const idToken = request.body.id_token;
    if (!idToken) {
        return response.status(400).send('There is no token');
    }
    
    try {
        const payload = await googleUser.verifyGoogleIdToken(idToken);
        const user = googleUser.createUser(payload);
        if (db.findUser(user.id)) {
            db.saveUser(user);
        }

        await saveSession(request);
        response.send(user);
    } catch (error) {
        console.log('google id token verification failed');
        response.status(500).send(error);
    }
});

router.patch('/update', auth, async (request, response) => {
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

router.get('/logout', auth, async (request, response) => {
    request.session.destroy((error) => {
        if (error) {
            return response.status(500);
        }
        
        response.redirect('../');
    });
});

router.get('/delete', auth, async (request, response) => {
    const user_id = request.user.user_id;
    try {
        await db.deleteUser(user_id);
        response.redirect('../');
    } catch (error) {
        response.status(500);
    }
});

const saveSession = (request) => {
    request.session.user_id = user.id;
    request.session.email = user.email;
    request.session.profile_picture_url = user.profile_picture_url;
    request.session.first_name = user.first_name;
    request.session.last_name = user.last_name;
    request.session.user_role = user.user_role;
    request.session.save();
}

module.exports = router;