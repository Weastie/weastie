/* globals States, game */

States.preload.prototype = {
	preload: function () {
		// game.load.spritesheet('bill', '/assets/script/games/become_a_law/rsc/bill.png', 32, 32);
		// game.load.image('title', '/assets/script/games/become_a_law/rsc/title.png');
	},
	create: function () {
		// Add the loading bar here 

		// game.state.start('menu');
	}
};

game.state.add('preload', States.preload);
