'use strict'
const mysql = require('mysql')

const tokritDb = mysql.createConnection({
  host: `localhost`,
  user: `root`,
  password: `111111`,
  database: `tokrit`
})

module.exports = Object.freeze({
  tokritDb
})