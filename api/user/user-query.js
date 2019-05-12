'use strict';

require('dotenv').config({ path: __dirname + '/../../.env' });
const mysql = require('mysql');
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

const findUser = (uid, callback) => {
    db.query(`SELECT * FROM users WHERE users.uid = '${uid}'`, callback);
}

const saveUser = (user) => {
    findUser(user.uid, (error, result) => {
        if (error) {
            console.log(error);
        }

        if (result.length === 0) {
            console.log('saving user to db');
            db.query(`INSERT INTO users (uid, email, profile_picture_url, first_name, last_name, created_at, role) VALUES ('${user.uid}', '${user.email}', '${user.profile_picture_url}', '${user.first_name}', '${user.last_name}', ${user.created_at}, '${user.role}')`);
        } else {
            console.log('user already exist');
        }
    });
}

const updateUser = ({ id, email, profile_picture_url, first_name, last_name, user_role }) => {
    db.query(`UPDATE users SET email = ${email}, profile_picture_url = ${profile_picture_url}, first_name = ${first_name}, last_name = ${last_name}, user_role = ${user_role} WHERE ${tableName}.id = ${uid}`);
}

const deleteUser = (uid) => {
    db.query(`DELETE FROM users WHERE users.id = '${uid}'`);
}

module.exports = {
    saveUser : saveUser,
    updateUser : updateUser,
    deleteUser : deleteUser
}