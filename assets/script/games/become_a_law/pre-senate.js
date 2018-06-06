/* globals States, game, display, createMenuButton */

States.preSenate.prototype = {
	create: function () {
		game.add.sprite(0, 0, 'bg');
		var text = 	'Stage 2: The Senate\n\n' +
								'With roaring support from the house, you already have\n' +
								'enough support to pass the senate!\n' +
								'But wait! Oh no! Rand Paul started a Filibuster!\n' +
								'Avoid Rand Paul and the yellow squares until he drops dead.\n' +
								'Just one yellow square is enough to stop you.\n\n' +
								'Use WASD or arrow keys to navigate the map.';
		game.add.graphics(40, 40)
			.beginFill(0xaaaaaa)
			.drawRect(0, 0, 720, 270)
			.alpha = 0.95;
		game.add.text(50, 50, text, {font: '15pt Arial', fill: 'white'});
		createMenuButton(display.width / 2, 3 * display.height / 4, 'Play', 20, function () {
			game.state.start('senate');
		});
	}
};

game.state.add('pre-senate', States.preSenate);
