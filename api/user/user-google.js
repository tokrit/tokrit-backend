'use strict';

require('dotenv').config({ path: __dirname + '/../../.env' });
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

async function verify(token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID
        });

        console.log('successfully verified id token');
        const payload = ticket.getPayload();
        return payload;
        
    } catch (error) {
        console.log(error);
    }
}

const newUser = (payload) => {
    const user = new Object();
    user.uid = payload['sub'];
    if (payload['email_verified']) {
        user.email = payload['email'];
    }
    user.profile_picture_url = payload['picture'];
    user.first_name = payload['given_name'];
    user.last_name = payload['family_name'];
    user.created_at = Date.now();
    user.role = 'user';

    return user;
}

module.exports = {
    verify: verify,
    newUser : newUser
}