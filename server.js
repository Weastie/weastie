// Lets me use my lets and consts
'use strict';

// Imports
global.essentials = require('./essentials.js');
// Manage the HTTP server
const express = require('express');
const app = express();
// Compress and speed up data transfer
const compression = require('compression');
// Manage session data (Admin logins, etc)
var session = require('express-session');
// Make sure that important errors WILL crash the server
const assert = require('assert');
// Read private.json
const jsonReader = require('json-reader');
// Concat JSONs
const combijson = require('combijson');
// Communicate with mongodb server
const mongoClient = require('mongodb').MongoClient;
// Store mongo collection data here
const mCols = {};
// Password hashing
const bcrypt = require('bcrypt-nodejs');
// Post data to other servers for verification
// const request = require('request')
// Read unencrypted body data
var bodyParser = require('body-parser');
// Read multipart forms
// const formidable = require('formidable');
// Manage file system
const fs = require('fs');
// const path = require('path');
// const mv = require('mv');
// HTTP or HTTPS
var http = require('http');
var https = require('https');

const PRODUCTION = (process.env.PRODUCTION === 'true');
console.log('PRODUCTION MODE: ' + PRODUCTION);

// Middleware and express configuration
app.use(bodyParser.urlencoded({extended: false}));
app.use(compression());
app.set('port', PRODUCTION ? 443 : 3000); // 443 (https) for production, 3000 for testing
app.set('view engine', 'pug');
app.set('views', './views');
app.use('/assets', express.static('./assets'));
app.use('/packages', express.static('./node_modules'));
// Lets encrypt verification
app.use('/.well-known/acme-challenge', express.static('./ssl/.well-known/acme-challenge'));

var startServer = function () {
	if (PRODUCTION) {
		// Get SSL certificate
		var ssl = {
			key: fs.readFileSync('/etc/letsencrypt/live/weastie.com/privkey.pem', 'utf8'),
			cert: fs.readFileSync('/etc/letsencrypt/live/weastie.com/fullchain.pem', 'utf8')
		};
		https.createServer(ssl, app).listen(app.get('port'), function () {
			console.log('Server started on port: ' + app.get('port'));
		});
		http.createServer(function (req, res) {
			res.writeHead(302, {'Location': 'https://www.weastie.com' + req.url});
			res.end();
		}).listen(80);
	} else {
		http.createServer(app).listen(app.get('port'), function () {
			console.log('Server started on port: ' + app.get('port'));
		});
	}
};

// Read sensitive data from private.json
jsonReader.jsonObject('./private.json', function (err, data) {
	assert.equal(null, err, 'Error when reading private.json: ' + err);
	// Use session secret
	app.use(session({secret: data.session_secret, saveUninitialized: true, resave: true}));

	// Connect to MongoDB server
	mongoClient.connect(data.databaseURL, function (err, client) {
		assert.equal(null, err, 'Error: Failed to connect to database: ' + err);
		const db = client.db('weastie');
		db.createCollection('users', function (err, collection) {
			assert.equal(null, err, 'Error: failed to open \'users\' collection: ' + err);
			mCols.users = collection;
		});

		console.log('Successfully connected to database...');
		startServer();
	});
});

// Function for simplifying the page rendering process
var renderTempl = function (file, req, res, extra) {
	extra = extra || {};
	if (!extra.hasOwnProperty('alerts')) {
		extra.alerts = [];
	}
	// Render the file, and send data including the session (prefixed by sess.) and the extra data
	res.render(file, combijson([{sess: req.session}, extra]));
};

// Shortcut to 404
var render404 = function (req, res) {
	renderTempl('core/result', req, res, {error: true, text: 'Error 404: Page not found'});
};

/*
 * General Pages
 */

// Send user the home page
app.get('/', function (req, res) {
	renderTempl('general/home', req, res);
});

// Logout
app.get('/logout', function (req, res) {
	if (req.session.loggedIn) {
		req.session.loggedIn = false;
		renderTempl('general/home', req, res, {alerts: [{message: 'Successfully logged out', type: 'success'}]});
	} else {
		renderTempl('general/home', req, res, {alerts: [{message: 'You must be logged in to log out', type: 'error'}]});
	}
});
// Login
app.get('/login', function (req, res) {
	renderTempl('account/login', req, res);
});
app.post('/login', function (req, res) {
	var form = JSON.parse(JSON.stringify(req.body));

	var legitForm = validateForm(form, {
		'user': 'string',
		'pass': 'string'
	});

	if (legitForm) {
		mCols.users.findOne({username: form.user}, function (err, doc) {
			assert.equal(err, null, 'Error when logging in user ' + form.user + ': ' + err);
			if (doc !== null) {
				bcrypt.compare(form.pass, doc.password, function (err, match) {
					assert.equal(err, null, 'Error when comparing passwords: ' + err);
					if (match) {
						// Passwords match, log in user
						setLoginSession(doc._id, req, function () {
							renderTempl('general/home', req, res, {alerts: [{message: 'Successfully logged in', type: 'success'}]});
						});
					} else {
						renderTempl('account/login', req, res, {alerts: [{message: 'Incorrect username or password', type: 'error'}]});
					}
				});
			} else {
				// Username does not exist
				renderTempl('account/login', req, res, {alerts: [{message: 'Incorrect username or password', type: 'error'}]});
			}
		});
	} else {
		res.end('Incorrect types in form');
	}
});
// Register
app.get('/register', function (req, res) {
	renderTempl('account/register', req, res);
});
app.post('/register', function (req, res) {
	var form = JSON.parse(JSON.stringify(req.body));
	// Make sure all parameters are a string
	var legitForm = validateForm(form, {
		'user': 'string',
		'email': 'string',
		'pass': 'string'
	});

	var alerts = [];

	if (legitForm) {
		// Validate inputs

		// Username
		if (form.user.length > 0 && form.user.length <= 20) {
			// Check regex
			var userRegex = /^([a-zA-Z0-9._!\-@#$%^&*()])+$/;
			if (!userRegex.test(form.user)) {
				alerts.push({message: 'Username does not fit allowed characters', type: 'error'});
			}
		} else {
			alerts.push({message: 'Username length not within bounds', type: 'error'});
		}

		// Password
		if (form.pass.length < 6 || form.pass.length > 512) {
			alerts.push({message: 'Password must be between 6 and 512 characters', type: 'error'});
		}

		// Email
		var emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (!emailRegex.test(form.email)) {
			alerts.push({message: 'Invalid email format', type: 'error'});
		}

		// All errors should be caught client side up to this point
		if (alerts.length === 0) {
			mCols.users.findOne({$or: [{username: form.user}, {email: form.email}]}, function (err, doc) {
				assert.equal(err, null, 'Error when checking is user/email exists: ' + err);
				if (doc === null) {
					// No user exists with that email or username --> hash password then continue
					bcrypt.hash(form.pass, null, null, function (err, hash) {
						assert.equal(err, null, 'Error when hashing password: ' + err);
						var newId = generateID(8);
						mCols.users.insert({
							_id: newId,
							username: form.user,
							email: form.email,
							password: hash,
							data: Date.now()
						}, function () {
							setLoginSession(newId, req, function () {
								renderTempl('general/home', req, res, {alerts: [{message: 'Successfully registered', type: 'success'}]});
							});
						});
					});
				} else {
					// A user already exists with that email or username
					if (form.user === doc.username) {
						alerts.push({message: 'A user with that username already exists', type: 'error'});
					}
					if (form.email === doc.email) {
						alerts.push({message: 'A user with that email already exists', type: 'error'});
					}
					renderTempl('account/register', req, res, {alerts: alerts});
				}
			});
		} else {
			renderTempl('account/register', req, res, {alerts: alerts});
		}
	} else {
		res.end('Incorrect types in form');
	}
});

function setLoginSession (id, req, callback) {
	mCols.users.findOne({_id: id}, function (err, doc) {
		assert.equal(err, null, 'Error when setting login session: ' + err);
		req.session.username = doc.username;
		req.session.email = doc.email;
		req.session._id = doc._id;
		req.session.loggedIn = true;
		callback();
	});
}

// Games
app.get('/games', function (req, res) {
	res.end('not implememted');
});

app.get('/games/brashbrawl', function (req, res) {
	renderTempl('games/brashbrawl', req, res);
});

// Given an object with properties, make sure each property is of correct type
// Form: an object with properties and values
// Obj: an object with properties that form should have, and their types
function validateForm (form, obj) {
	for (var key in obj) {
		if (form.hasOwnProperty(key)) {
			if (toType(form[key]) !== obj[key]) {
				return false;
			}
		}
	}
	return true;
}
app.get('/register', function (req, res) {
	renderTempl('account/register', req, res);
});

/*
 * 404
 */
app.use(function (req, res, next) {
	render404(req, res);
});

// Returns a number to be used in base 32 for ID storage
function generateID (numLetters) {
	let b32Lower = '';
	let b32Upper = '';
	for (let i = 0; i < numLetters; i++) {
		b32Lower += '0'; // Lowest base32 ascii
		b32Upper += 'v'; // Highest base32 ascii
	}
	const lowerBound = Number.parseInt(b32Lower, 32);
	const upperBound = Number.parseInt(b32Upper, 32);
	return Math.floor(Math.random() * (upperBound - lowerBound)) + lowerBound;
}
// Function from stack overflow: https://stackoverflow.com/questions/7390426/better-way-to-get-type-of-a-javascript-variable#7390612
function toType (obj) {
	return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}
