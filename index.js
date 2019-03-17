var express = require('express');
var bodyParser = require('body-parser');
var bkfd2Password = require('pbkdf2-password');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var hasher = bkfd2Password();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('public'));

var mysql = require('mysql');
var conn = mysql.createConnection({
  host: 'localhost',
  user: 'tokrit',
  password: '111111',
  database: 'tokrit'
});
conn.connect();

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

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', './views');

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done){
  console.log('serial');
  done(null, user.authId);
});

passport.deserializeUser(function(id, done){
  console.log('deserializeUser', id);
  var sql = 'SELECT * FROM member WHERE authId=?';
  conn.query(sql, [id], function(err, results){
    if(err){
      console.log(err);
      done('There is no user.');
    }else{
      done(null, results[0]);
    }
  });
});

passport.use(new LocalStrategy(
  function(username, password, done){
    var uname = username;
    var pwd = password;
    var sql = 'SELECT * FROM member WHERE authId=?';
    conn.query(sql, ['local:'+uname], function(err, results){
      if(err){
        return done('There is no user.');
      }
      var user = results[0];
      salt = user.salt;
      return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){
        if(hash === user.password){
          console.log('success');
          done(null, user);
        }else{
          console.log('failure\n', hash);
          done(null, false);
        }
      });
    });
  }
));

app.post(
  '/login',
  passport.authenticate(
    'local',
    {
      successRedirect: '/member',
      failureRedirect: '/join',
      failureFlash:false
    }
  )
);

app.get('/join', function (req, res) {
  res.render('join');
})

app.get('/login', function (req, res) {
  res.render('login');
})

app.get('/member', function (req, res) {
  var authId = req.session.passport.user;
  if(authId != null){
    console.log("select *" + authId);
    var sql = 'SELECT * FROM member where authId = ?';
    conn.query(sql, [authId], function(err, users, fields){
      var jsonArray = JSON.stringify(users);
      console.log(jsonArray);
      //res.send(jsonArray);
      res.render('memberInfo', {member: jsonArray});
    });
  }else{
    res.redirect('/join');
  }
})

app.post('/member', function (req, res) {
  hasher({password:req.body.password}, function(err, pass, salt, hash){
    var user ={
      authId: 'local:' + req.body.username,
      password: hash,
      salt: salt,
      firstName : 'firstName',
      lastName : 'lastName',
      isAdmin : false
    };
    var sql = 'INSERT INTO member SET ?';
    conn.query(sql, user, function(err, results){
      if(err){
        console.log(err);
        res.status(500);
      }else{
        req.login(user, function(err){
          req.session.save(function(){
            console.log('Login!! Session created!!');
          })
        });
        //var jsonArray = JSON.stringify(results);
        //res.send('memberInfo');
        //res.redirect('/member');
      }
    });
  });
})

app.put('/member/update', (req, res) => {
  let authId = req.session.passport.user;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let sql = 'SELECT * FROM member WHERE authId=?'
  conn.query(sql, [authId], (err, results) => {
    if (err) throw err;
    let user = results[0]
    let rawPassword = { password: req.body.password };
    let salt = user.salt;
    let encryptedPassword = hasher(rawPassword, (err, pass, salt, hash) => {
      password = hash;
    });
    let isAdmin = req.body.isAdmin;
    sql = `UPDATE member SET password = ?, firstName = ?, lastName = ?, isAdmin = ? where authId = ?`
    conn.query(sql, [encryptedPassword, firstName, lastName, isAdmin, authId], (err) => {
      if (err) {
        console.log(err)
        res.status(500);
      }
      res.redirect('/member')
    })
  })
});

app.put('/member', function (req, res) {
  res.send('Hello put!');
})
app.delete('/member', function (req, res) {
  res.send('Hello delete!');
})

app.get('/logout', function(req, res){
  req.logout();
  req.session.save(function(){
    res.send('logout!!');
  });
})

app.listen(3003, function(){
  console.log('Connected port 3003!');
})

// 공지
// 게시판 개념의 페이지(관리자 모드 필요)
// 회원가입 > POST, PUT, DELETE, GET
// 공지게시판 > POST, PUT, DELETE, GET
// 세션

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
