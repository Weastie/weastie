/* globals States, game, display */

States.menu.prototype = {
	create: function () {
		game.add.sprite(0, 0, 'bg');
		game.add.sprite(display.width / 2, 50, 'title').anchor.setTo(0.5, 0.5);
		game.stage.backgroundColor = '#ddd';
		createMenuButton(display.width / 2, display.height / 2, 'Start', 25, function () {
			game.state.start('pre-house');
		});
	}
};

game.state.add('menu', States.menu);

function createMenuButton (x, y, text, fontSize, onClick, options) {
	options = options || {};
	var btn = game.add.button(x, y, 'btn', onClick, this, 1, 0, 1, 1);
	btn.anchor.setTo(0.5);
	var txt = game.add.text(0, 0, text, {
		stroke: 'black',
		strokeThickness: 2,
		fill: 'white',
		font: fontSize + 'pt Arial'
	});
	txt.anchor.setTo(0.5);
	btn.addChild(txt);
	if (options.scale) {
		btn.scale.setTo(options.scale.x, options.scale.y);
		btn.children[0].scale.setTo(1 / options.scale.x, 1 / options.scale.y);
	}
	return btn;
}
