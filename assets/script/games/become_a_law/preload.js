/* globals States, game */

States.preload.prototype = {
	preload: function () {
		game.load.spritesheet('bill', '/assets/script/games/become_a_law/rsc/bill.png', 32, 32);
		game.load.spritesheet('randPaul', '/assets/script/games/become_a_law/rsc/rand_paul.png', 50, 68);
		game.load.spritesheet('btn', '/assets/script/games/become_a_law/rsc/btn.png', 250, 60);
		game.load.image('title', '/assets/script/games/become_a_law/rsc/title.png');
		game.load.image('bg', '/assets/script/games/become_a_law/rsc/background.png');
		game.load.image('flag', '/assets/script/games/become_a_law/rsc/flag.jpg');
		game.load.image('flag_sad', '/assets/script/games/become_a_law/rsc/flag_sad.jpg');
		game.load.image('load_bg', '/assets/script/games/become_a_law/rsc/load_bg.jpg');
		game.load.image('republican_load', '/assets/script/games/become_a_law/rsc/republican_load.png');
		game.load.image('democrat_load', '/assets/script/games/become_a_law/rsc/democrat_load.png');
		game.load.image('house_load', '/assets/script/games/become_a_law/rsc/house_load.png');
	},
	create: function () {
		// Add the loading bar here
		game.state.start('menu');
	}
};

game.state.add('preload', States.preload);
