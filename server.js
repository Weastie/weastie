// Lets me use my lets and consts
'use strict';

// Imports
global.essentials = require('./essentials.js');
// Manage the HTTP server
const express = require('express');
const app = express();
// Compress and speed up data transfer
const compression = require('compression');
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
// Calculations with mongodb storage size
var BSON = require('bson');
var bson = new BSON();
// Password hashing
const bcrypt = require('bcrypt-nodejs');
// Post data to other servers for verification
const request = require('request');
// URL parsing
const URL = require('url');
// Read unencrypted body data
var bodyParser = require('body-parser');
// Read forms
// const formidable = require('formidable');
// Manage file system
const fs = require('fs');
const path = require('path');
global.path = path;
// const mv = require('mv');
// HTTP or HTTPS
var http = require('http');
var https = require('https');

// To run system commands
var exec = require('child_process').exec;

// Captcha key
var captchaKey;

// Compile less
exec('lessc assets/css/pre-compile/main.less assets/css/compiled/main.css');

const PRODUCTION = (process.env.PRODUCTION === 'true');
console.log('PRODUCTION MODE: ' + PRODUCTION);

// Middleware and express configuration
app.use(bodyParser.urlencoded({extended: false, limit: '80kb'}));
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
		// Create http server for redirect
		http.createServer(function (req, res) {
			res.writeHead(302, {'Location': 'https://www.weastie.com' + req.url});
			res.end();
		}).listen(80);
	} else {
		app.listen(app.get('port'), function () {
			console.log('Server started on port: ' + app.get('port'));
		});
	}
};

// Read sensitive data from private.json
jsonReader.jsonObject('./private.json', function (err, data) {
	assert.equal(null, err, 'Error when reading private.json: ' + err);
	// Captcha key
	captchaKey = data.captcha_secret;
	// Connect to MongoDB server
	mongoClient.connect(data.databaseURL, function (err, client) {
		assert.equal(null, err, 'Error: Failed to connect to database: ' + err);
		const db = client.db('weastie');
		db.createCollection('listeners', function (err, collection) {
			assert.equal(null, err, 'Error: failed to open \'listeners\' collection: ' + err);
			mCols.listeners = collection;
			mCols.listeners.createIndex({'createdAt': 1}, {expireAfterSeconds: 3600 * 48});
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
	// Render the file, and send extra data such as alerts
	res.render(file, extra);
};

// Shortcut to 404
var render404 = function (req, res) {
	res.status(404);
	renderTempl('core/result', req, res, {error: true, text: 'Error 404: Page not found'});
};

// Robots.txt - Allow all robots
app.get('/robots.txt', function (req, res) {
	res.end('User-agent: *\nDisallow:\n');
});

/*
 * General Pages
 */

// Send user the home page
app.get('/', function (req, res) {
	renderTempl('general/home', req, res);
});

// Hack Tools
app.get('/hack_tools', function (req, res) {
	renderTempl('hack_tools/main', req, res);
});

app.get('/hack_tools/listener', function (req, res) {
	renderTempl('hack_tools/listener/setup', req, res);
});

app.get('/hack_tools/listener/:_id', function (req, res) {
	var id = global.essentials.convertID(req.params._id);
	mCols.listeners.findOne({_id: id}, function (err, doc) {
		assert.equal(err, null, 'Error when searching for listener (1): ' + err);
		if (doc) {
			// Show most recent requests first
			doc.requests.sort(function (a, b) {
				return b.date - a.date;
			});
			renderTempl('hack_tools/listener/listener', req, res, {data: doc, id: req.params._id});
		} else {
			renderTempl('core/result', req, res, {error: true, text: 'Could not find a listener with the id: ' + req.params._id});
		}
	});
});

app.all(['/l/:_id', '/l/:_id/*'], function (req, res) {
	res.redirect('/');
	var id = global.essentials.convertID(req.params._id);
	mCols.listeners.findOne({_id: id}, function (err, doc) {
		assert.equal(err, null, 'Error when searching for listener (2): ' + err);
		if (doc) {
			if (!doc.full) {
				// The doc is not over the limit so we'll add the new data
				var info = {
					date: Date.now(),
					method: req.method,
					ip: req.ip,
					path: req.path,
					body: req.body
				};
				mCols.listeners.update({_id: id}, {$push: {requests: info}}, function (err) {
					assert.equal(err, null, 'Error adding listen data to collection: ' + err);
					// Now let's test the size of it the collection to make sure it isn't too big
					// Max: 100kb
					var size = bson.calculateObjectSize(doc) + bson.calculateObjectSize(info);
					console.log('size: ' + size);
					if (size > 100000) {
						mCols.listeners.update({_id: id}, {$set: {full: true}});
					}
				});
			}
		}
	});
});

app.post('/hack_tools/create_listener', function (req, res) {
	// Test captcha
	request({
		url: 'https://www.google.com/recaptcha/api/siteverify',
		method: 'POST',
		form: {
			secret: captchaKey,
			response: req.body['g-recaptcha-response'],
			remoteip: req.ip
		}
	}, function (err, response, body) {
		assert.equal(err, null, 'Error testing google captcha key: ' + err);
		if (JSON.parse(body).success) {
			// Success!
			var id = generateID(4);
			mCols.listeners.findOne({_id: id}, function (err, doc) {
				// Make sure that the listener does not currently exist
				assert.equal(err, null, 'Error checking if listener exists: ' + err);
				if (doc) {
					res.end('Something super duper rare happened! Try again please...');
				} else {
					mCols.listeners.insertOne({
						_id: id,
						createdAt: new Date(),
						requests: [],
						full: false
					}, function (err) {
						assert.equal(err, null, 'Error creating listener: ' + err);
						res.redirect(path.join('/hack_tools/listener/', global.essentials.convertID(id)));
					});
				}
			});
		} else {
			renderTempl('hack_tools/listener/setup', req, res, {alerts: [{message: 'Please complete captcha', type: 'error'}]});
		}
	});
});

app.get('/hack_tools/converter', function (req, res) {
	renderTempl('hack_tools/converter', req, res);
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
		} else {
			return false;
		}
	}
	return true;
}

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
