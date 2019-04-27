'use strict';

require('dotenv').config;
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

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

module.exports = {
    verifyGoogleIdToken : verifyGoogleIdToken,
    createUser : createUser
}