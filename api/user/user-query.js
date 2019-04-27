'use strict';

require('dotenv').config;
const mysql = require('mysql');
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

const tableName = 'users';

const saveUser = (user) => {
    db.query(`INSERT INTO ${tableName} (id, email, profile_picture_url, first_name, last_name, created_at, user_role`
        + `VALUES (${user.id}, ${user.email}, ${user.profile_picture_url}, ${user.first_name}, ${user.last_name}, ${user.created_at}, ${user.user_role}`);
}

const findUser = (id) => {
    db.query(`SELECT * FROM ${tableName} where ${tableName}.id = ${id}`, (error, result) => {
        if (error) {
            throw new Error(error);
        }

        if (!result) {
            return false;
        }

        return result;
    });
}

const updateUser = ({ id, email, profile_picture_url, first_name, last_name, user_role }) => {
    db.query(`UPDATE ${tableName} SET email = ${email}, profile_picture_url = ${profile_picture_url}, first_name = ${first_name}, last_name = ${last_name}, user_role = ${user_role} WHERE ${tableName}.id = ${id}`);
}

const deleteUser = (user_id) => {
    db.query(`DELETE FROM ${tableName} WHERE ${tableName}.id = ${user_id}`);
}

module.exports = {
    saveUser : saveUser,
    findUser : findUser,
    updateUser : updateUser,
    deleteUser : deleteUser
}