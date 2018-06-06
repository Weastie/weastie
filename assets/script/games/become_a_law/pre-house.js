/* globals States, game, display, createMenuButton */

States.preHouse.prototype = {
	create: function () {
		game.add.sprite(0, 0, 'bg');
		var text = 	'Stage 1: The House\n\n' +
								'Only 1/3rd of the house currently supports you.\n' +
								'Collect blue and red dots to gain Republican and Democrat votes.\n' +
								'Avoid yellow squares! You will lose some support from both houses.\n' +
								'Votes and squares expire after 45 seconds.\n' +
								'If you drop below 30% of the vote, you will lose.\n\n' +
								'Use WASD or arrow keys to navigate the map.';
		game.add.graphics(40, 40)
			.beginFill(0xaaaaaa)
			.drawRect(0, 0, 720, 270)
			.alpha = 0.95;
		game.add.text(50, 50, text, {font: '15pt Arial', fill: 'white'});
		createMenuButton(display.width / 2, 3 * display.height / 4, 'Play', 20, function () {
			game.state.start('house');
		});
	}
};

game.state.add('pre-house', States.preHouse);
