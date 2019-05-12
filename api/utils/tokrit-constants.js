'use strict'
const mysql = require('mysql')

const tokritDb = mysql.createConnection({
  host: `localhost`,
  user: `testuser`,
  password: `123123`,
  database: `tokrit`
});

module.exports = Object.freeze({
  tokritDb
});