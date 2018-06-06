/* globals States, game, display, createMenuButton */

States.win.prototype = {
	create: function () {
		game.add.sprite(0, 0, 'bg');
		var text = 	'Congratulations!\n\n' +
								'After passing through both chambers, you have successfully made\n' +
								'your way to the president Donald J. Trump\'s desk. Unfortunately, you\n' +
								'being a climate change bill has caused Trump to veto you. Nice try\n' +
								'globalists and all of the nasty hombres. Can\'t stop winning.\n';
		game.add.graphics(40, 40)
			.beginFill(0xaaaaaa)
			.drawRect(0, 0, 720, 200)
			.alpha = 0.95;
		game.add.text(50, 50, text, {font: '15pt Arial', fill: 'white'});
		createMenuButton(display.width / 2, 3 * display.height / 4, 'Menu', 20, function () {
			game.state.start('menu');
		});
	}
};

game.state.add('win', States.win);
