const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
var flash = require('connect-flash');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('public'));

// This needs to be moved somewhere, should not be in version control
const mysql = require('mysql');
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'tokrit',
  password: '111111',
  database: 'tokrit'
});
conn.connect();

// This needs to be moved somewhere, should not be in version control
app.use(session({
    secret: 'asoidjfoiasjef@#$v!$()',
    resave: false,
    saveUninitialized: true,
    store: new MySQLStore({
      host: 'localhost',
      port: 3306,
      user: 'tokrit',
      password: '111111',
      database: 'tokrit'
    })
  })
);

app.use(flash())
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', './views');

const passport = require('./lib/passport')(app, conn)
const authRouter = require('./routes/auth')(passport, conn)

app.use('/member', authRouter)

// renders join(sign up) page
app.get('/join', function (req, res) {
  res.render('join');
})

// redners log in page
app.get('/login', function (req, res) {
  res.render('login');
})

app.use(function (req, res, next) {
  res.status(404).send('404 Not Found');
});

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('500 Internal Server Error')
});

app.listen(3003, function(){
  console.log('Connected port 3003!');
})

// table member ( Create, update, delete, select )
// pid
// authId facebook:hellow
// email
// pw varchar(255)
// salt varchar(255)
// name varchar(20)
// isAdmin boolean
// CREATE TABLE member(
//    pid INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
//    authId  VARCHAR(50) NOT NULL,
//    password VARCHAR(255) NOT NULL,
//    salt VARCHAR(255) NOT NULL,
//    firstName VARCHAR(20),
//    lastName VARCHAR(20),
//    isAdmin BOOLEAN
// );
//
//
