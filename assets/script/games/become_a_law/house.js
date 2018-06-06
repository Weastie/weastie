/* globals Phaser, States, game, display, kb, createMenuButton */
var bill;
var repubDots;
var democDots;
var obstacDots;
var repubVotesText;
var democVotesText;
var houseVotesText;
var repubProgBar;
var democProgBar;
var houseProgBar;
var dotSurvivalLength = 45;
var votes = {
	repub: {
		total: 0,
		current: 0
	},
	democ: {
		total: 0,
		current: 0
	},
	total: 435
};
var bounds;
var gameArea = {
	x: 0,
	y: 0,
	width: 480,
	height: display.height
};
var eventTimer;
var eventsText;
var firstNames = ['Bradley', 'Andrew', 'Ryan', 'Axel', 'Mahek', 'Sal', 'Kirsten'];
var lastNames = ['Marx', 'Hitler', 'Stalin', 'Putin', 'Mussolini', 'Trump', 'Clinton', 'Sanders'];
var goodEvents = ['#{media} news just covered you in good light!', 'Politician #{name} endorsed you!'];
var badEvents = ['#{media} just covered a protest against you!', 'Politician #{name} protested against you!'];
var newsStations = ['Not Fake News™', 'Jeb\'s Mom\'s Favorite Son\'s News™', 'Covfefe News™', 'As accurate at Bradley Seltzer\'s Deadlines News™'];
// Events being random was far too random. So I made them determined
// 1 is a good thing, 0 is a bad thing
var eventID = 1;

var billSpeed = 250;

States.house.prototype = {
	create: function () {
		game.add.sprite(0, 0, 'bg').alpha = 0.05;
		game.time.events.start();

		// Set up display
		game.stage.backgroundColor = '#ddd';

		// Start physics system
		game.physics.startSystem(Phaser.Physics.ARCADE);

		// Set up groups
		repubDots = game.add.group();
		repubDots.enableBody = true;
		democDots = game.add.group();
		democDots.enableBody = true;
		obstacDots = game.add.group();
		obstacDots.enableBody = true;
		bounds = game.add.group();
		bounds.enableBody = true;

		// Timers
		// Run first event in 5 seconds, then start the loop
		game.time.events.add(Phaser.Timer.SECOND * 5, function () {
			newEvent();
			eventTimer = game.time.create(false);
			eventTimer.loop(Phaser.Timer.SECOND * 10, newEvent);
			eventTimer.start();
		}, this);

		// Add text and progress bars
		votes.repub.total = game.rnd.integerInRange(218 - 40, 218 + 40);
		votes.repub.current = Math.floor(1 / 3 * votes.repub.total);
		votes.democ.total = votes.total - votes.repub.total;
		votes.democ.current = Math.floor(1 / 3 * votes.democ.total);
		game.add.text(515, 50, 'Current House:');
		game.add.sprite(490, 91, 'load_bg');
		repubProgBar = game.add.sprite(494, 95, 'republican_load');
		game.add.sprite(490, 151, 'load_bg');
		democProgBar = game.add.sprite(494, 155, 'democrat_load');
		game.add.sprite(490, 211, 'load_bg');
		houseProgBar = game.add.sprite(494, 215, 'house_load');
		game.add.text(495, 102, 'Republican: ', {
			font: '18pt Arial',
			fontWeight: 'lighter'
		});
		repubVotesText = game.add.text(680, 102, votes.repub.current + ' / ' + votes.repub.total, {
			font: '18pt Arial',
			fontWeight: 'lighter'
		});
		game.add.text(495, 162, 'Democrat: ', {
			font: '18pt Arial',
			fontWeight: 'lighter'
		});
		democVotesText = game.add.text(680, 162, votes.democ.current + ' / ' + votes.repub.total, {
			font: '18pt Arial',
			fontWeight: 'lighter'
		});
		game.add.text(495, 222, 'House: ', {
			font: '18pt Arial',
			fontWeight: 'lighter'
		});
		houseVotesText = game.add.text(680, 222, (votes.democ.current + votes.repub.current) + ' / ' + votes.total, {
			font: '18pt Arial',
			fontWeight: 'lighter'
		});
		repubProgBar.scale.x = votes.repub.current / votes.repub.total;
		democProgBar.scale.x = votes.democ.current / votes.democ.total;
		houseProgBar.scale.x = (votes.repub.current + votes.democ.current) / votes.total;

		eventsText = game.add.text(515, 300, '', {
			font: '17pt Arial',
			fontWeight: 'lighter',
			wordWrap: true,
			wordWrapWidth: 260
		});

		// Create rectangle for game boundaries
		var areas = [{x: gameArea.x, y: gameArea.y, width: 2, height: gameArea.height},
									{x: gameArea.x, y: gameArea.y + gameArea.height, width: gameArea.width, height: 2},
									{x: gameArea.x, y: gameArea.y, width: gameArea.width, height: 2},
									{x: gameArea.x + gameArea.width, y: gameArea.y, width: 2, height: gameArea.height}];
		for (var i = 0; i < areas.length; i++) {
			var rect = game.add.graphics(areas[i].x, areas[i].y);
			rect.beginFill('#333', 1);
			rect.drawRect(0, 0, areas[i].width, areas[i].height);
			game.physics.enable(rect, Phaser.Physics.ARCADE);
			rect.body.immovable = true;
			bounds.add(rect);
		}

		// Setup character
		bill = game.add.sprite(300, 300, 'bill');
		bill.anchor.setTo(0.5, 0.5);
		game.physics.enable(bill, Phaser.Physics.ARCADE);

		// Reset keyboard
		for (var k in kb) {
			kb[k].onDown.removeAll();
		}
	},
	update: function () {
		// Prevent player from exiting game
		game.physics.arcade.collide(bill, bounds);

		// Bounce dots off the walls
		game.physics.arcade.collide(repubDots, bounds);
		game.physics.arcade.collide(democDots, bounds);
		game.physics.arcade.collide(obstacDots, bounds);

		game.physics.arcade.overlap(bill, repubDots, function (a, b) {
			flashColor(b.fillColor, repubVotesText);
			flashColor(b.fillColor, houseVotesText);
			votes.repub.current++;
			repubProgBar.scale.x = votes.repub.current / votes.repub.total;
			houseProgBar.scale.x = (votes.repub.current + votes.democ.current) / votes.total;
			updateTexts();
			updateBillFrame();
			b.destroy();
			checkWin();
		});
		game.physics.arcade.overlap(bill, democDots, function (a, b) {
			flashColor(b.fillColor, democVotesText);
			flashColor(b.fillColor, houseVotesText);
			votes.democ.current++;
			democProgBar.scale.x = votes.democ.current / votes.democ.total;
			houseProgBar.scale.x = (votes.repub.current + votes.democ.current) / votes.total;
			updateTexts();
			updateBillFrame();
			b.destroy();
			checkWin();
		});
		game.physics.arcade.overlap(bill, obstacDots, function (a, b) {
			flashColor(b.fillColor, democVotesText);
			flashColor(b.fillColor, repubVotesText);
			flashColor(b.fillColor, houseVotesText);
			votes.repub.current -= game.rnd.integerInRange(3, 8);
			votes.democ.current -= game.rnd.integerInRange(3, 8);
			houseProgBar.scale.x = (votes.repub.current + votes.democ.current) / votes.total;
			repubProgBar.scale.x = votes.repub.current / votes.repub.total;
			democProgBar.scale.x = votes.democ.current / votes.democ.total;
			updateTexts();
			updateBillFrame();
			b.destroy();
			checkLose();
		});

		// Handle movement of bill based on keyboard input
		if (bill.alive) {
			bill.body.velocity.setTo(0, 0);
			var velY = 0;
			var velX = 0;
			if (kb.W.isDown || kb.UP.isDown) {
				velY = -billSpeed;
			} else if (kb.S.isDown || kb.DOWN.isDown) {
				velY = billSpeed;
			}
			if (kb.D.isDown || kb.RIGHT.isDown) {
				velX = billSpeed;
				bill.scale.x = 1;
			} else if (kb.A.isDown || kb.LEFT.isDown) {
				velX = -billSpeed;
				bill.scale.x = -1;
			}
			if (Math.abs(velX) > 0 && Math.abs(velY) > 0) {
				// If diagnol movement, speed should be divided by sqrt(2);
				velX = Math.round(velX / Math.sqrt(2));
				velY = Math.round(velY / Math.sqrt(2));
			}
			bill.body.velocity.setTo(velX, velY);
		}
	},
	render: function () {
		game.debug.geom(game.world.bounds, '#ff0000', false);
	}
};

function updateBillFrame () {
	var curProgress = (votes.repub.current + votes.democ.current) / votes.total;
	bill.frame = Math.floor((curProgress - 0.3) * 20);
}

function updateTexts () {
	repubVotesText.setText(votes.repub.current + ' / ' + votes.repub.total);
	democVotesText.setText(votes.democ.current + ' / ' + votes.democ.total);
	houseVotesText.setText((votes.democ.current + votes.repub.current) + ' / ' + votes.total);
}

function flashColor (color, opt) {
	var flash = game.add.graphics(opt.x, opt.y);
	flash.beginFill(color, 1);
	flash.drawRect(0, 0, opt.width, opt.height);
	flash.alpha = 0;
	game.add.tween(flash).to({alpha: 0.3}, 65, 'Linear', true).onComplete.add(function () {
		game.add.tween(flash).to({alpha: 0}, 65, 'Linear', true).onComplete.add(function (a, b) {
			a.destroy();
		});
	});
}

function newEvent () {
	var magnitude = game.rnd.integerInRange(25, 32);
	var text;
	var style = {
		fontSize: 14,
		wordWrap: true,
		wordWrapWidth: 250
	};
	if (eventID % 2) {
		// Good thing
		spawnVotes(magnitude);
		style.fill = '#058306';
		text = game.rnd.pick(goodEvents);
	} else {
		// Bad thing
		spawnObstacles(5);
		style.fill = '#7c0016';
		text = game.rnd.pick(badEvents);
	}
	eventID++;
	// Replace #{media} with news stations
	if (text.indexOf('#{media}') >= 0) {
		text = text.replace('#{media}', game.rnd.pick(newsStations));
	}
	// Replace #{name} with names
	if (text.indexOf('#{name}') >= 0) {
		text = text.replace('#{name}', game.rnd.pick(firstNames) + ' ' + game.rnd.pick(lastNames));
	}
	eventsText.setText(text);
	eventsText.setStyle(style);
}

function spawnVotes (n) {
	for (var i = 0; i < n; i++) {
		var repub = game.rnd.integerInRange(0, 1);
		// Make sure location is far from character
		var randX;
		var randY;
		do {
			randX = game.rnd.integerInRange(gameArea.x + 10, gameArea.x + gameArea.width - 10);
			randY = game.rnd.integerInRange(gameArea.y + 10, gameArea.y + gameArea.height - 10);
		} while (game.physics.arcade.distanceBetween(bill, {x: randX, y: randY}) < 250);

		var speedX = game.rnd.integerInRange(25, 150);
		var speedY = game.rnd.integerInRange(25, 150);
		var dot = game.add.graphics(randX, randY);
		dot.beginFill(0x000000);
		dot.drawCircle(5, 5, 10);
		if (repub) {
			dot.beginFill(0xff0000, 1);
		} else {
			dot.beginFill(0x0000ff, 1);
		}
		dot.drawCircle(5, 5, 8);
		game.physics.enable(dot, Phaser.Physics.ARCADE);
		dot.body.velocity.setTo(game.rnd.integerInRange(0, 1) ? speedX : -speedX,
														game.rnd.integerInRange(0, 1) ? speedY : -speedY);
		dot.body.bounce.setTo(1, 1);
		if (repub) {
			repubDots.add(dot);
		} else {
			democDots.add(dot);
		}
		// All dots are removed after 35 seconds
		game.time.events.add(Phaser.Timer.SECOND * dotSurvivalLength, function (a) {
			a.destroy();
		}, this, dot);
	}
}
function spawnObstacles (n) {
	for (var i = 0; i < n; i++) {
		// Make sure location is far from characte	r
		var randX;
		var randY;
		do {
			randX = game.rnd.integerInRange(gameArea.x + 10, gameArea.x + gameArea.width - 10);
			randY = game.rnd.integerInRange(gameArea.y + 10, gameArea.y + gameArea.height - 10);
		} while (game.physics.arcade.distanceBetween(bill, {x: randX, y: randY}) < 250);

		var speedX = game.rnd.integerInRange(25, 150);
		var speedY = game.rnd.integerInRange(25, 150);
		var dot = game.add.graphics(randX, randY);

		dot.beginFill(0x000000);
		dot.drawRect(-1, -1, 10, 10);
		dot.beginFill(0xe6cf36);
		dot.drawRect(0, 0, 8, 8);
		game.physics.enable(dot, Phaser.Physics.ARCADE);
		dot.body.velocity.setTo(game.rnd.integerInRange(0, 1) ? speedX : -speedX,
														game.rnd.integerInRange(0, 1) ? speedY : -speedY);
		dot.body.bounce.setTo(1, 1);
		obstacDots.add(dot);
		// All dots are removed after 35 seconds
		game.time.events.add(Phaser.Timer.SECOND * dotSurvivalLength, function (a) {
			a.destroy();
		}, this, dot);
	}
}

function checkWin () {
	if ((votes.repub.current + votes.democ.current) / votes.total > 0.5) {
		game.time.events.destroy();
		obstacDots.destroy();
		repubDots.destroy();
		democDots.destroy();
		bill.destroy();
		var flag = game.add.image(display.width / 2, display.height / 2, 'flag');
		flag.anchor.setTo(0.5, 0.5);
		flag.alpha = 0.75;
		var txt = game.add.text(display.width / 2, display.height / 2 - 60, 'YOU PASSED!', {
			stroke: 'black',
			strokeThickness: 10,
			fill: 'white',
			font: '50pt Arial'
		});
		createMenuButton(display.width / 2, display.height / 2 + 60, 'Continue to Senate', 30, function () {
			game.state.start('pre-senate');
		}, {
			scale: {
				x: 1.8,
				y: 1.8
			}
		});
		txt.anchor.setTo(0.5, 0.5);
	}
}

function checkLose () {
	if ((votes.repub.current + votes.democ.current) / votes.total < 0.3) {
		game.time.events.destroy();
		obstacDots.destroy();
		repubDots.destroy();
		democDots.destroy();
		var flag = game.add.image(display.width / 2, display.height / 2, 'flag_sad');
		flag.anchor.setTo(0.5, 0.5);
		flag.alpha = 0.75;
		var txt = game.add.text(display.width / 2, display.height / 2 - 60, 'You lost...', {
			stroke: 'black',
			strokeThickness: 10,
			fill: 'white',
			font: '70pt Arial'
		});
		createMenuButton(display.width / 2, display.height / 2 + 60, 'Back to Menu', 30, function () {
			game.state.start('menu');
		}, {
			scale: {
				x: 1.8,
				y: 1.8
			}
		});
		txt.anchor.setTo(0.5, 0.5);
	}
}
game.state.add('house', States.house);
