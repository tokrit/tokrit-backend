'use strict';
require('dotenv').config;
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

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

const mysql = require('mysql');
const db = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE
});

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

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
        const payload = await verifyGoogleIdToken(idToken);
        const user = createUser(payload);
        if (isNewUser(user.id)) {
            saveUser(user);
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
        await updateUser(user_id, request.body);
        const user = await findUser(user_id);
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
        await deleteUser(user_id);
        response.redirect('../');
    } catch (error) {
        response.status(500)
    }
})

const verifyGoogleIdToken = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID
        });

        return payload = ticket.getPayload();
    } catch (error) {
        response.status(500).send(error);
    }
}

const isNewUser = (user_id, response) => {
    db.query(`SELECT id FROM users where id = ${user_id}`, (error, user) => {
        if (error) {
            return response.status(500);
        }

        return user ? false : true;
    });
}

const createUser = (payload) => {
    user = new Object();    
    user.id = payload['sub'];
    if (payload['email_verified']) {
        user.email = payload['email'];
    }
    user.profile_picture_url = payload['picture'];
    user.first_name = payload['given_name'];
    user.last_name = payload['family_name']; 
    user.created_at = Date.now();
    user.user_role = 'user';

    return user;
}

const saveUser = (user) => {
    db.query('INSERT INTO users (id, email, profile_picture_url, first_name, last_name, created_at, user_role'
        + `VALUES (${user.id}, ${user.email}, ${user.profile_picture_url}, ${user.first_name}, ${user.last_name}, ${user.created_at}, ${user.user_role}`);
}

const findUser = (id) => {
    db.query(`SELECT * FROM users where users.id = ${id}`, (error, result) => {
        if (error) {
            throw new Error(error);
        }

        if (!result) {
            throw new Error('Unable to find the reulst');
        }

        return result;
    });
}

const updateUser = ({ id, email, profile_picture_url, first_name, last_name, user_role} ) => {
    db.query(`UPDATE users SET email = ${email}, profile_picture_url = ${profile_picture_url}, first_name = ${first_name}, last_name = ${last_name}, user_role = ${user_role}`);        
}

const deleteUser = (user_id) => {
    db.query(`DELETE FROM users WHERE user_id = ${user_id}`);
}

const saveSession = (request) => {
    request.session.user_id = user.id;
    request.session.email = user.email;
    request.session.profile_picture_url = user.profile_picture_url;
    request.session.first_name = user.first_name;
    request.session.last_name = user.last_name;
    request.session.created_at = user.created_at;
    request.session.user_role = user.user_role;
    request.session.save();
}

const auth = async (request, response, next) => {
    try {
        const user = await JSON.parse(sessionStore.store.get(req.sessionID));
        request.user = user;        
        next();
    } catch (error) {
        resizeBy.status(401).send({ error: 'Authentication failed' });
    }
}

module.exports = router;