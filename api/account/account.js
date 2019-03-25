'use strict'

const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session);
const bkfd2Password = require('pbkdf2-password');
const hasher = bkfd2Password();
const express = require('express')
const router = express.Router()

const options = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '111111',
  database: 'tokrit'
}
const sessionStore = new MySQLStore(options)
const mysql = require('mysql')
const tokritDb = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '111111',
  database: 'tokrit'
})

module.exports = router

router.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
  })
)

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

router.use(passport.initialize())
router.use(passport.session())

passport.serializeUser(
  (user, done) => {
    console.log('serializeUser')
    done(null, user.id)
  }
);

passport.deserializeUser(
  (id, done) => {
    console.log('deserializeUser')
    tokritDb.query('SELECT * from accounts where id = ?', [id], 
      (error, user) => {
        done(error, user)
      }
    )
  }
);

//#region sign up
passport.use('local-signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
  }, (request, email, password, done) => {
    
    if (!validateEmail(email)) {
      return done(null, false)
    }

    // check if email is already taken
    tokritDb.query('SELECT * from accounts where email = ?', [email], (error, user) => {
      if (error) {
        return done(error)
      } else if (user.length) {
        console.log(`Too bad! email is already taken`)
        return done(null, false)
      } else {
        console.log('There is no email registered in database, creating new user')

        // create user
        hasher({password: password}, 
          (error, pass, salt, hash) => {
            const newUser = new Object();
            newUser.email = email;
            newUser.encryptedPassword = hash
            newUser.salt = salt
            newUser.firstName = request.body.firstName
            newUser.lastName = request.body.lastName
            newUser.created = Date.now(),
            newUser.isAdmin = false
            //console.log(`%s %s %s %s %s %s`, newUser.email, newUser.encryptedPassword, newUser.salt, newUser.firstName, newUser.lastName, newUser.created, newUser.isAdmin)
            tokritDb.query('INSERT INTO accounts (email, encryptedPassword, salt, firstName, lastName, created) ' +
              'VALUES (?, ?, ?, ?, ?, ?)', [newUser.email, newUser.encryptedPassword, newUser.salt, newUser.firstName, newUser.lastName, newUser.created, newUser.isAdmin], 
              (error, rows) => {
                // create session for new user
                request.login(user, (error) => {
                  request.session.save(() => {
                    console.log('Created new account and logged in, session created')
                    newUser.id = rows.insertId
                    return done(null, newUser);
                  })
                })
              }
            )
          }
        )
      }
    })
  })
)

router.post('/signup', passport.authenticate('local-signup', { failureRedirect: '/fail' }),
  (reqeust, response) => {
    response.redirect('/')
  }
)
//#endregion

//#region log in
passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, (request, email, password, done) => {
      tokritDb.query('SELECT * from accounts where email = ?', [email], (error, user) => {
        if (error) {
          return done(error)
        } 
        if (!user.length) {
          console.log('Invalid email')
          return done(null, false)
        } else {
            hasher({ password: password, salt: user[0].salt }, 
            (error, pass, savedSalt, hash) => {
              let encryptedPassword = hash;
              if (encryptedPassword !== user[0].encryptedPassword) {
                console.log('incorrect password')
                return done(null, false)
              } 
              console.log('correct password!')
              return done(null, user[0])
            })
          }
        }
      )
    }
  )
)

router.post('/login', passport.authenticate('local-login', { failureRedirect: '/fail' }),
  (reqeust, response) => {
    response.redirect('/')
  }
)
//#endregion

//#region log out
router.get('/logout', (request, response) => {
  request.logout()
  request.redirect('/')
})
//#endregion

//#region update profile
router.put('/update', (req, res) => {
  let id = req.session.passport.user;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let sql = 'SELECT * FROM accounts WHERE id=?'
  tokritDb.query(sql, [id], (err, results) => {
    if (err) throw err;
    let user = results[0]
    let rawPassword = { password: req.body.password };
    let salt = user.salt;
    let isAdmin = req.body.isAdmin;
    hasher(rawPassword, (err, pass, salt, hash) => {
      let encryptedPassword = hash;
      sql = `UPDATE accounts SET encryptedPassword = ?, firstName = ?, lastName = ?, isAdmin = ? where id = ?`
      tokritDb.query(sql, [encryptedPassword, firstName, lastName, isAdmin, id], (err) => {
        if (err) {
          console.log(err)
          res.status(500);
        }
        res.redirect(200, '/')
      });
    })
  })
});
//#endregion

function validateEmail(email) {
  var ret = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return ret.test(String(email).toLowerCase());
}
