/* globals Phaser, States, game, kb, display, createMenuButton */

var bill;
var billSpeed = 250;
var filibuster;
var attackTimer;
var obstacDots;
var bounds;
var gameArea = {
	x: 0,
	y: 0,
	width: 480,
	height: display.height
};
var dotSize = 10;
var durationText;
var durationTimer;
var durationBar;

States.senate.prototype = {
	create: function () {
		game.add.sprite(0, 0, 'bg').alpha = 0.05;
		game.time.events.start();
		// Set up display
		game.stage.backgroundColor = '#ddd';

		// Start physics system
		game.physics.startSystem(Phaser.Physics.ARCADE);

		// Set up groups
		obstacDots = game.add.group();
		obstacDots.enableBody = true;
		bounds = game.add.group();
		bounds.enableBody = true;

		// Set up text and progress bar
		game.add.sprite(490, 41, 'load_bg');
		durationBar = game.add.sprite(494, 45, 'house_load');
		durationText = game.add.text(495, 52, 'Time left: 60s', {
			font: '20pt Arial',
			fontWeight: 'lighter'
		});
		durationTimer = game.time.create(false);
		durationTimer.add(Phaser.Timer.SECOND * 60, win);
		durationTimer.start();

		// Setup character
		bill = game.add.sprite(300, 300, 'bill');
		bill.anchor.setTo(0.5, 0.5);
		game.physics.enable(bill, Phaser.Physics.ARCADE);

		// After 0.5 seconds, create the filibuster and start the loop
		game.time.events.add(Phaser.Timer.SECOND * 0.5, function () {
			// Win after 60s
			createFilibuster();
			attackTimer = game.time.create(false);
			attackTimer.loop(Phaser.Timer.SECOND * 8, filibusterAttack);
			attackTimer.start();
		}, this);

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
	},
	update: function () {
		// Update duration
		if (durationTimer.running) {
			durationBar.scale.x = (60 - durationTimer.seconds) / 60;
			durationText.setText('Time Left: ' + (60 - (durationTimer.seconds > 0
				? durationTimer.seconds : 0)).toFixed(1) + 's ');
			bill.frame = Math.floor(durationTimer.seconds / 12);
		}
		// Prevent player from exiting game
		game.physics.arcade.collide(bill, bounds);

		// Bounce dots off the walls
		game.physics.arcade.collide(obstacDots, bounds);
		game.physics.arcade.collide(filibuster, bounds, function (a, b) {
			if (filibuster.body.velocity.x > 0) {
				filibuster.scale.x = 1;
			} else {
				filibuster.scale.x = -1;
			}
		});

		// Lose
		game.physics.arcade.overlap(bill, filibuster, lose);
		game.physics.arcade.overlap(bill, obstacDots, lose);

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
	}
};

function createFilibuster () {
	// Setup filibuster
	var randX;
	var randY;
	filibuster = game.add.sprite(0, 0, 'randPaul');

	do {
		randX = game.rnd.integerInRange(gameArea.x + 2, gameArea.x + gameArea.width - filibuster.width - 2);
		randY = game.rnd.integerInRange(gameArea.y + 2, gameArea.y + gameArea.height - filibuster.height - 2);
	} while (game.physics.arcade.distanceBetween(bill, {x: randX, y: randY}) < 250);

	filibuster.position.setTo(randX, randY);
	filibuster.frame = 0;

	filibuster.anchor.setTo(0.5);
	filibuster.position.setTo(filibuster.x + filibuster.width / 2, filibuster.y + filibuster.height / 2);

	game.physics.enable(filibuster, Phaser.Physics.ARCADE);

	filibuster.body.velocity.setTo(25, 25);
	filibuster.body.bounce.setTo(1, 1);
}

function filibusterAttack () {
	filibuster.frame = 1;
	var numAttacks = game.rnd.integerInRange(4, 6);
	for (var i = 0; i < numAttacks; i++) {
		var speedX = game.rnd.integerInRange(25, 125);
		var speedY = game.rnd.integerInRange(25, 125);
		var dot = game.add.graphics(filibuster.x - dotSize / 2,
																filibuster.y + 10 - dotSize / 2);

		dot.beginFill(0x000000);
		dot.drawRect(-1, -1, dotSize, dotSize);
		dot.beginFill(0xe6cf36);
		dot.drawRect(0, 0, dotSize - 2, dotSize - 2);
		game.physics.enable(dot, Phaser.Physics.ARCADE);
		dot.body.velocity.setTo(game.rnd.integerInRange(0, 1) ? speedX : -speedX,
														game.rnd.integerInRange(0, 1) ? speedY : -speedY);
		dot.body.bounce.setTo(1, 1);
		obstacDots.add(dot);
		// All dots are removed after some seconds
		// game.time.events.add(Phaser.Timer.SECOND * dotSurvivalLength, function (a) {
		// 	a.destroy();
		// }, this, dot);
	}
	filibuster.sendToBack();
	game.time.events.add(Phaser.Timer.SECOND * 0.5, function () {
		filibuster.frame = 0;
	});
}

function win () {
	game.time.events.destroy();
	attackTimer.destroy();
	durationTimer.destroy();
	obstacDots.destroy();
	bill.destroy();
	filibuster.destroy();
	var flag = game.add.image(display.width / 2, display.height / 2, 'flag');
	flag.anchor.setTo(0.5, 0.5);
	flag.alpha = 0.75;
	var txt = game.add.text(display.width / 2, display.height / 2 - 60, 'You Passed!', {
		stroke: 'black',
		strokeThickness: 10,
		fill: 'white',
		font: '76pt Arial'
	});
	createMenuButton(display.width / 2, display.height / 2 + 60, 'Continue', 30, function () {
		game.state.start('win');
	}, {
		scale: {
			x: 1.8,
			y: 1.8
		}
	});
	txt.anchor.setTo(0.5, 0.5);
}

function lose () {
	game.time.events.destroy();
	attackTimer.destroy();
	durationTimer.destroy();
	obstacDots.destroy();
	bill.destroy();
	filibuster.destroy();
	var flag = game.add.image(display.width / 2, display.height / 2, 'flag_sad');
	flag.anchor.setTo(0.5, 0.5);
	flag.alpha = 0.75;
	var txt = game.add.text(display.width / 2, display.height / 2 - 60, 'You lost...', {
		stroke: 'black',
		strokeThickness: 10,
		fill: 'white',
		font: '76pt Arial'
	});
	createMenuButton(display.width / 2, display.height / 2 + 60, 'Try again', 30, function () {
		game.state.start('pre-senate');
	}, {
		scale: {
			x: 1.8,
			y: 1.8
		}
	});
	txt.anchor.setTo(0.5, 0.5);
}

game.state.add('senate', States.senate);
