module.exports = function(app, conn) {
	const passport = require('passport')
	const LocalStrategy = require('passport-local').Strategy
	const bkfd2Password = require('pbkdf2-password');
	const hasher = bkfd2Password();

	app.use(passport.initialize());
	app.use(passport.session());

	// called when user logs in
	// only serialize user.authID(email address) for the session
	// to keep the amount of data stored within the session small
	passport.serializeUser(function (user, done) {
		console.log('serializeUser');
		done(null, user.authId);
	});

	// called everytime user visit/reload page to confirm if user is logged in
	passport.deserializeUser(function (id, done) {
		console.log('deserializeUser', id);
		var sql = 'SELECT * FROM member WHERE authId=?';
		conn.query(sql, [id], function (err, results) {
			if (err) {
				console.log(err);
				done('There is no user.');
			} else {
				done(null, results[0]);
			}
		});
	});

	// Login
	passport.use(new LocalStrategy(
		function (username, password, done) {
			var uname = username;
			var pwd = password;
			var sql = 'SELECT * FROM member WHERE authId=?';
			conn.query(sql, ['local_' + uname], function (err, results) {
				if (err) {
					return done('There is no user.');
				}
				var user = results[0];
				salt = user.salt;
				return hasher({ password: pwd, salt: user.salt }, function (err, pass, salt, hash) {
					if (hash === user.password) {
						console.log('success');
						done(null, user);
					} else {
						console.log('failure\n', hash);
						done(null, false);
					}
				});
			});
		}
	));

	return passport;
}