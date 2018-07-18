/* globals Phaser */

var display = {
	width: 800,
	height: 600
};

var kb = {};

var game = new Phaser.Game(display.width, display.height, Phaser.CANVAS, 'gameCanvas');

var States = {};
States.boot = function (game) {};
States.preload = function (game) {};
States.menu = function (game) {};

States.boot.prototype = {
	preload: function () {
		// game.load.image('mainMenu', assetsLoc + 'sprites/menus/mainMenu.png');
		// game.load.image('loadBar', assetsLoc + 'sprites/menus/loadBar.png');
		// game.load.image('loadBarBg', assetsLoc + 'sprites/menus/loadBarBg.png');
		kb.W = game.input.keyboard.addKey(Phaser.Keyboard.W);
		kb.A = game.input.keyboard.addKey(Phaser.Keyboard.A);
		kb.S = game.input.keyboard.addKey(Phaser.Keyboard.S);
		kb.D = game.input.keyboard.addKey(Phaser.Keyboard.D);
		kb.UP = game.input.keyboard.addKey(Phaser.Keyboard.UP);
		kb.LEFT = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
		kb.DOWN = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
		kb.RIGHT = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
		kb.SPACE = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    kb.CTRL = game.input.keyboard.addKey(Phaser.Keyboard.CONTROL);
	},
	create: function () {
		game.state.start('preload');
	}
};

game.state.add('boot', States.boot);

function createMenuButton (x, y, text, fontSize, onClick) { //eslint-disable-line
	var btn = game.add.button(x, y, 'menuButton', onClick, this, 1, 0, 1, 1);
	btn.anchor.setTo(0.5);
	var txt = game.add.text(0, 0, text, {stroke: 'black', strokeThickness: 2, fill: '#bde2a0', font: fontSize + 'pt "Open Sans"'});
	txt.anchor.setTo(0.5);
	btn.addChild(txt);
	return btn;
}
