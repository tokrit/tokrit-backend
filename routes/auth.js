const express = require('express')
const router = express.Router()
const bkfd2Password = require('pbkdf2-password');
const hasher = bkfd2Password();

module.exports = function(passport, conn) {

	// sign up(join), create user in database
	// TODO: validate if authId is email
	router.post('/', function(req, res) {
		hasher({ password: req.body.password }, function (err, pass, salt, hash) {
			var user = {
				authId: 'local_' + req.body.username,
				password: hash,
				salt: salt,
				firstName: 'firstName',
				lastName: 'lastName',
				isAdmin: false
			};
			var sql = 'INSERT INTO member SET ?';
			conn.query(sql, user, function (err, results) {
				if (err) {
					console.log(err);
					res.status(500);
				} else {
					req.login(user, function (err) {
						req.session.save(function () {
							console.log('Login!! Session created!!');
							res.redirect('/member')
						})
					});
					//var jsonArray = JSON.stringify(results);
					//res.send('memberInfo');
					//res.redirect('/member');
				}
			});
		});
	})

	// user info
	router.get('/', function (req, res) {
		var authId = req.session.passport.user;
		if (authId != null) {
			console.log("select *" + authId);
			var sql = 'SELECT * FROM member where authId = ?';
			conn.query(sql, [authId], function (err, users, fields) {
				var jsonArray = JSON.stringify(users);
				console.log(jsonArray);
				//res.send(jsonArray);
				res.render('memberInfo', { member: jsonArray });
			});
		} else {
			res.redirect('/join');
		}
	})

	// update user profile
	router.put('/update', (req, res) => {
		let authId = req.session.passport.user;
		let firstName = req.body.firstName;
		let lastName = req.body.lastName;
		let sql = 'SELECT * FROM member WHERE authId=?'
		conn.query(sql, [authId], (err, results) => {
			if (err) {
				console.log(err)
			}
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
				res.redirect(200, '/member')
			})
		})
	});

	// login, redirect when login success/fail
	router.post('/login',
		passport.authenticate('local', {
			successRedirect: '/member',
			failureRedirect: '/join',
			failureFlash: false
		})
	);

	// logout, redirects to home
	router.get('/logout', function (req, res) {
		req.logout();
		req.session.save(function () {
			res.send('logout!!');
		});
		res.redirect('/')
	})

	return router;
}
