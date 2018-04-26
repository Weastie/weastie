/* global io */
var socket = io('weastie.com:8085');
var canvas;
var ctx;
var myId;
var isPlaying = false;
var mapWidth = 800;
var latency = 0;
var pingTime = 0;
var tiles = [null];
var extras = [null];
var curMap = {};
var mapReady = false;
var blockSize = 64;
var mouseDown;
var respawnTime;
var chatLog;
var showLeaderboard = false;
var curWeapon = 'rifle';
var curWeaponId = 0;
var explosions = [];
var showMinimap = false;
var minimapReady = false;
var bonuses = [];
var leaderboards = [];
var gameMode = 0;
var teams = [
	{
		kills: 0
	}, {
		kills: 0
	}, {
		kills: 0
	}
];

var lastCursorPos = {
	x: 0,
	y: 0
};
var mousePos = {
	x: 0,
	y: 0
};
var centerOfMe = {
	x: 0,
	y: 0
};

var weaponsList = {
	rifle: {
		name: 'Rifle',
		wpnSprite: null,
		bltSprite: null
	},
	shotgun: {
		name: 'Shotgun',
		wpnSprite: null,
		bltSprite: null
	},
	sniper: {
		name: 'Sniper',
		wpnSprite: null,
		bltSprite: null
	},
	machineGun: {
		name: 'Machine Gun',
		wpnSprite: null,
		bltSprite: null
	},
	rocketLauncher: {
		name: 'Rocket Launcher',
		wpnSprite: null,
		bltSprite: null
	},
	jihad: {
		name: 'Jihad',
		wpnSprite: null,
		bltSprite: null
	}
};

var weaponIds = ['rifle', 'shotgun', 'sniper',
	'machineGun', 'rocketLauncher', 'jihad'];

var bonusesList = {
	health: {
		sprite: null
	},
	speed: {
		sprite: null
	},
	damage: {
		sprite: null
	}
};

var numTiles = 12;
var numTilesLoaded = 0;
function loadTiles () {
	for (var x = 1; x <= numTiles; x++) {
		tiles[x] = new Image();
		tiles[x].src = '/assets/brashbrawl/tiles/' + x + '.png';
		tiles[x].onload = function () {
			numTilesLoaded++;
		}
	}
}
loadTiles();

var numExtras = 27;
var numExtrasLoaded = 0;
function loadExtras() {
	for (var x = 1; x <= numExtras; x++) {
		extras[x] = new Image();
		extras[x].src = '/assets/brashbrawl/extras/' + x + '.png';
		extras[x].onload = function () {
			numExtrasLoaded++;
		}
	}
}
loadExtras();

var numBullets = 5;
var numBulletsLoaded = 0;
function loadBullets() {
	for (var w in weaponsList) {
		weaponsList[w].bltSprite = new Image();
		weaponsList[w].bltSprite.src = '/assets/brashbrawl/bullets/' + w + '.png';
		weaponsList[w].bltSprite.onload = function() {
			numBulletsLoaded++;
		}
	}
}
loadBullets();

var numBonuses = 3;
var numBonusesLoaded = 0;
function loadBonuses() {
	for (var b in bonusesList) {
		bonusesList[b].sprite = new Image();
		bonusesList[b].sprite.src = '/assets/brashbrawl/bonuses/' + b + '.png';
		bonusesList[b].sprite.onload = function() {
			numBonusesLoaded++;
		}
	}
}
loadBonuses();

var numGunsLoaded = 0;
function loadGuns() {
	for (var w in weaponsList) {
		weaponsList[w].wpnSprite = new Image();
		weaponsList[w].wpnSprite.src = '/assets/brashbrawl/guns/' + w + '.png';
		weaponsList[w].wpnSprite.onload = function() {
			numGunsLoaded++;
		}
	}
}
loadGuns();

$(document).ready(function () {
	$('#input-div').removeClass('hidden');
	canvas = document.getElementById('gamecanvas');
	canoffset = $(canvas).offset();
	document.getElementById('input-div').style.left = canoffset.left + canvas.width/2 + 'px';
	window.onresize = function() {
		canoffset = $(canvas).offset();
		document.getElementById('input-div').style.left = canoffset.left + canvas.width/2 + 'px';
	}
	document.getElementById('input-div').addEventListener('keydown', function(e) {
		if (e.keyCode == 13) {
			enterGame();
		}
	})
	document.getElementById('chat-form').addEventListener('keydown', function(e) {
		if (e.keyCode == 13) {
			sendChat();
		}
	})
	ctx = canvas.getContext('2d');
	canvas.addEventListener('mousemove', function(event) {
		mousePos = getCursorPosition(event);
	});

	canvas.addEventListener('mousedown', function(event) {
		if (!mouseDown) {
			if (event.buttons == 1) {
				mouseDown = true;
				socket.emit('mouse-down',mouseDown);
			}else{
				event.preventDefault();
			}
		}
	});

	canvas.addEventListener('mouseup', function(event) {
		if (mouseDown) {
			mouseDown = false;
			socket.emit('mouse-down',mouseDown);
		}
	});

	//Keyboard & Mouse input

	canvas.addEventListener('keydown',function(e) {
		if (isPlaying && document.hasFocus()) {
			if (e.keyCode == 87 || e.keyCode == 38) { //W
				if (!keyboardInput.moveUp) {
					keyboardInput.moveUp = true;
					socket.emit('move-up',true);
				}
			}
			if (e.keyCode == 65 || e.keyCode == 37) { //A
				if (!keyboardInput.moveLeft) {
					keyboardInput.moveLeft = true;
					socket.emit('move-left',true);
				}
			}
			if (e.keyCode == 83 || e.keyCode == 40) { //S
				if (!keyboardInput.moveDown) {
					keyboardInput.moveDown = true;
					socket.emit('move-down',true);
				}
			}
			if (e.keyCode == 68 || e.keyCode == 39) { //D
				if (!keyboardInput.moveRight) {
					keyboardInput.moveRight = true;
					socket.emit('move-right',true);
				}
			}
			if (e.keyCode == 9) { //D
				showLeaderboard = true;
				e.preventDefault();
			}
			if (e.keyCode == 69)	{ //E
				socket.emit('use');
			}
			if (e.keyCode == 77)	{ //M
				showMinimap = true;
			}
			if (e.keyCode == 81)	{ //Q
				// console.log(typeof curWeaponId);
				if (weaponIds.length > curWeaponId+1) {
					socket.emit('swap-weapon',weaponIds[curWeaponId+1]);
				}else{
					socket.emit('swap-weapon',weaponIds[0]);
				}
			}
			if (e.keyCode >= 49 && e.keyCode <= 57) {
				if (weaponIds.length > e.keyCode-49) {
					socket.emit('swap-weapon',weaponIds[e.keyCode-49]);
				}
			}
		}
	});
	canvas.addEventListener('keyup',function(e) {
		if (isPlaying && document.hasFocus()) {
			if (e.keyCode == 87 || e.keyCode == 38) { //W
				if (keyboardInput.moveUp) {
					keyboardInput.moveUp = false;
					socket.emit('move-up',false);
				}
			}
			if (e.keyCode == 65 || e.keyCode == 37) { //A
				if (keyboardInput.moveLeft) {
					keyboardInput.moveLeft = false;
					socket.emit('move-left',false);
				}
			}
			if (e.keyCode == 83 || e.keyCode == 40) { //S
				if (keyboardInput.moveDown) {
					keyboardInput.moveDown = false;
					socket.emit('move-down',false);
				}
			}
			if (e.keyCode == 68 || e.keyCode == 39) { //D
				if (keyboardInput.moveRight) {
					keyboardInput.moveRight = false;
					socket.emit('move-right',false);
				}
			}
			if (e.keyCode == 9) { //D
				showLeaderboard = false;
			}
			if (e.keyCode == 77)	{ //M
				showMinimap = false;
			}
		}
	});
});

var playerListOpen = {};
var playerListSecure = {};
var bullets = [];
var keyboardInput = {
	moveUp:false,
	moveLeft:false,
	moveRight:false,
	moveDown:false
}

function addMessage(msg) {
	document.getElementById('chat-ul').innerHTML += msg;
	$('#chat-area').scrollTop($('#chat-area')[0].scrollHeight);
}

function showControls() {
	addMessage('<u>Controls</u><br>WASD/Arrow Keys: Move<br>123456: Change Weapon<br>Q: Increment Weapon<br>E: Use (Opens doors)<br>TAB: Show Leaderboard')
}

function sendChat() {
	var msg = document.getElementById('chatInput').value;
	document.getElementById('chatInput').value = '';
	if (msg.substr(0,1) === '!') {
		//command
		socket.emit('send-command',msg.substr(1,msg.length));
	}else{
		socket.emit('send-chat-message',msg);
	}
}
function preGameLoadUp() {
	canvas.focus();
	socket.emit('request-map');
	socket.emit('enter-game',document.getElementById('nameInput').value);
	isPlaying = true;
	update();
	ping();
}
function enterGame() {
	document.getElementById('input-div').style.display = 'none';
	if (socket.connected) {
		preGameLoadUp();
	}else{
		ctx.font='30pt Arial';
		ctx.textAlign='center';
		ctx.fillStyle='black';
		ctx.fillText('Connecting...',canvas.width*0.5,canvas.height*0.5);
		socket.onconnect=function(){
			preGameLoadUp();
		}
		setTimeout(function(){
			//Could not connect
			if (!socket.connected) {
				ctx.clearRect(0,0,canvas.width,canvas.height);
				ctx.fillStyle='red';
				ctx.fillText('Could not connect!',canvas.width*0.5,canvas.height*0.5)
				socket.close();
			}
		},5000)
	}
}

socket.on('your-id', function(id) {
	myId = id;
});
socket.on('get-chat-message', function(sentBy,msg) {
	if (playerListOpen[sentBy]) {
		if (isPlaying) {
			addMessage('<li><span style=\'color: ' + playerListOpen[sentBy].color + '\'>' + playerListOpen[sentBy].name + '</span>: ' + msg.replace(/</g, '&lt;').replace(/>/g, '&gt;')+ '</li>')
		}
	}
})
socket.on('send-basic-player-info', function(data) {
	playerListOpen = data;
	for (var p in playerListOpen) {
		playerListOpen[p].name = playerListOpen[p].name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
	generateLeaderboards();
})
socket.on('new-player',function(newPlayer) {
	playerListOpen[newPlayer.id] = newPlayer;
	playerListOpen[newPlayer.id].name = playerListOpen[newPlayer.id].name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	if (isPlaying) {
		addMessage('<li><span style=\'color: ' + newPlayer.color + '\'>' + newPlayer.name + ' has connected!');
	}
	generateLeaderboards();
});
socket.on('delete-player', function(playerId) {
	//If they don't exist, no errors are returned, so let's just delete them no matter what.
	if (isPlaying) {
		addMessage('<li><span style=\'color: ' + playerListOpen[playerId].color + '\'>' + playerListOpen[playerId].name + ' has disconnected! :(');
	}
	delete playerListOpen[playerId];
	delete playerListSecure[playerId];
	generateLeaderboards();
});
socket.on('send-secure-player-info', function(data) {
	playerListSecure = data;
	for (var p in playerListSecure) {
		playerListSecure[p].x = Math.round(playerListSecure[p].x);
		playerListSecure[p].y = Math.round(playerListSecure[p].y);
	}
});
socket.on('send-bullet-info', function(data) {
	bullets = data;
});
socket.on('send-bonuses-info', function(data) {
	bonuses = data;
})
socket.on('send-explosions-info', function(data) {
	 explosions = data;
});
socket.on('new-weapon', function(name) {
	curWeaponId = 0;
	curWeapon = name;
	for (var i = 0; i < weaponIds.length; i++) {
		if (weaponIds[i] === curWeapon) {
			curWeaponId = i;
			break;
		}
	}
});
socket.on('send-map', function(name,map,extrMap,color,curGameMode) {
	gameMode = curGameMode;
	minimapReady = false;
	curMap.minimap = new Image();
	curMap.minimap.src = '/assets/brashbrawl/minimaps/' + name + '.png'
	curMap.minimap.onload = function() {
		minimapReady = true;
	}
	curMap.map = map;
	curMap.name = name;
	curMap.bgcolor = color;
	curMap.extrMap = extrMap;
	mapReady = true;
});
socket.on('edit-extra', function(extraId,newExtra) {
	if (mapReady) {
		curMap.extrMap[extraId].extra = newExtra;
	}
})
socket.on('player-killed', function(killer,killed,weapon) {
	if (playerListOpen[killer] && playerListOpen[killed]) {
		var klr = '<span style=\'color:' + playerListOpen[killer].color + '\'>' + playerListOpen[killer].name + '</span>'
		var kld = '<span style=\'color:' + playerListOpen[killed].color + '\'>' + playerListOpen[killed].name + '</span>'
		weapon = weaponsList[weapon].name;

		var text = '';

		playerListOpen[killed].deaths++;
		if (killed === killer) {
			text = klr + ' just ' + weapon + '\'d themself!';
		} else {
			playerListOpen[killer].kills++;
			teams[playerListOpen[killer].team].kills++;
			playerListOpen[killer].score++;
			var text = '';
			var type = Math.floor(Math.random() * 4);

			if (type === 0) {
				text = klr + ' just rekt ' + kld + ' with a ' + weapon;
			} else if (type === 1) {
				text = klr + ' just ' + weapon + '\'d ' + kld;
			} else if (type === 2) {
				text = klr + ' just shoved a ' + weapon + ' down ' + kld + '\'s throat';
			} else if (type === 3) {
				text = 'An attack from ' + klr + '\'s ' + weapon + ' just ruined ' + kld + '\'s hopes of becoming a ' + ['painter', 'garbage man', 'gardener', 'delivery boy', 'zoo owner'][Math.floor(Math.random() * 5)];
			}
		}
		if (isPlaying) {
			addMessage('<li>' + text + '</li>');
		}
		generateLeaderboards();
	}
});

socket.on('death', function(timeOfRespawn) {
	respawnTime = Date.now()+timeOfRespawn-latency;
})

function generateLeaderboards() {
	leaderboards = [];
	for (var p in playerListOpen) {
		leaderboards.push({score:playerListOpen[p].score,kills:playerListOpen[p].kills,deaths:playerListOpen[p].deaths,name:playerListOpen[p].name,color:playerListOpen[p].color});
	}
	leaderboards.sort(function(a,b){return b.score-a.score});
}

function drawPlayers() {
	for (var p in playerListSecure) {
		if (p == myId && playerListSecure[myId].alive == false) {
		}else{
			//Fill text
			ctx.font = '11pt Arial';
			ctx.fillStyle = 'black';
			ctx.textAlign = 'center';
			ctx.fillText(playerListOpen[p].name,playerListSecure[p].x+playerListSecure[p].width*0.5,playerListSecure[p].y-20);

			//Fill player health bar

			ctx.fillStyle='red';
			var hbs = Math.round((playerListSecure[p].width*1.5)*0.125)/0.125;
			ctx.fillRect(playerListSecure[p].x-(hbs-playerListSecure[p].width)/2,playerListSecure[p].y-15,hbs,10);
			ctx.fillStyle='green';
			ctx.fillRect(playerListSecure[p].x-(hbs-playerListSecure[p].width)/2,playerListSecure[p].y-15,Math.ceil((playerListSecure[p].health/100)*hbs),10);
			ctx.strokeStyle='black';
			if (playerListSecure[p].isJihad) {
				ctx.strokeStyle='red';
			}
			ctx.lineWidth = 2;
			ctx.strokeRect(playerListSecure[p].x-(hbs-playerListSecure[p].width)/2,playerListSecure[p].y-15,hbs,10);

			//Fill Player
			if (playerListSecure[p].isInvuln) {
				ctx.globalAlpha = 0.6;
				ctx.fillStyle = 'white';
				ctx.fillRect(playerListSecure[p].x,playerListSecure[p].y,playerListSecure[p].width,playerListSecure[p].height);
			}
			ctx.fillStyle = playerListOpen[p].color;
			ctx.fillRect(playerListSecure[p].x,playerListSecure[p].y,playerListSecure[p].width,playerListSecure[p].height);
			ctx.globalAlpha = 1;
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 2;
			ctx.strokeRect(playerListSecure[p].x+1,playerListSecure[p].y+1,playerListSecure[p].width-2,playerListSecure[p].height-2);
		}
	}
}

function drawExplosions() {
	for (var e = 0; e < explosions.length; e++) {
		ctx.fillStyle = 'yellow';
		ctx.strokeStyle = 'orange';
		ctx.lineWidth = 20;
		ctx.beginPath();
		ctx.arc(explosions[e].x,explosions[e].y,explosions[e].radius,0,2*Math.PI);
		ctx.fill();
		ctx.arc(explosions[e].x,explosions[e].y,explosions[e].radius-(ctx.lineWidth/2),0,2*Math.PI);
		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = 'red';
		ctx.beginPath();
		ctx.arc(explosions[e].x,explosions[e].y,explosions[e].radius/3,0,2*Math.PI);
		ctx.fill();
		ctx.closePath();

	}
}

function drawBullets() {
	if (numBullets == numBulletsLoaded) {
		for (var b = 0; b < bullets.length; b++) {
				ctx.drawImage(weaponsList[bullets[b].weapon].bltSprite,bullets[b].x,bullets[b].y);
			}
	}
}

function drawBonuses() {
	if (numBonuses == numBonusesLoaded) {
		for (var b = 0; b < bonuses.length; b++) {
			ctx.drawImage(bonusesList[bonuses[b].bonus].sprite,bonuses[b].x,bonuses[b].y);
		}
	}
}

function drawTile(tile,x,y) {
	if (numTiles == numTilesLoaded) {
		ctx.drawImage(tiles[tile],x,y);
	}
}

function drawMap() {
	for (var i = 0; i < curMap.map.length; i++) {
		for (var j = 0; j < curMap.map[i].length; j++) {
			if (curMap.map[i][j] != 0) {
				//Only draw if player will be able to see it.
				var block = {
					x:j*blockSize,
					y:i*blockSize
				}
				var centerOfBlock = {
					x:block.x+0.5*blockSize,
					y:block.y+0.5*blockSize
				}
				if (Math.abs(centerOfPlayer.x-centerOfBlock.x) <= 400 + (0.5 * blockSize)) {
					//User is in x proximity, check for y now
					if (Math.abs(centerOfPlayer.y-centerOfBlock.y) <= 300 + (0.5 * blockSize)) {
						drawTile(curMap.map[i][j],block.x,block.y);
					}
				}
			}
		}
	}
}

function drawExtra(extra) {
	if (numExtras == numExtrasLoaded) {
		ctx.drawImage(extras[extra.extra],extra.x*blockSize,extra.y*blockSize);
	}
}

function drawExtras() {
	for (var e in curMap.extrMap) {
		var centerOfExtraTile = {
			x:curMap.extrMap[e].x*blockSize+blockSize*0.5,
			y:curMap.extrMap[e].y*blockSize+blockSize*0.5
		}
		if (curMap.extrMap[e].extra >= 1) {
			if (Math.abs(centerOfPlayer.x-centerOfExtraTile.x) <= 400 + (0.5 * blockSize)) {
				//User is in x proximity, check for y now
				if (Math.abs(centerOfPlayer.y-centerOfExtraTile.y) <= 300 + (0.5 * blockSize)) {
					drawExtra(curMap.extrMap[e]);
				}
			}
		}
	}
}

function drawPing() {
	ctx.fillStyle = 'black';
	ctx.font = '12pt Arial'
	ctx.textAlign = 'left';
	ctx.fillText('Latency: '+latency + 'ms',60,570);
}

function drawLeaderboard() {
	ctx.globalAlpha = 0.8;
	ctx.fillStyle = '#496be2';
	ctx.fillRect(60,45,680,510);
	ctx.strokeStyle = 'blue';
	ctx.lineWidth = '3';
	ctx.globalAlpha = 1;
	ctx.strokeRect(60,45,680,510);
	ctx.font = '19pt Arial';
	ctx.fillStyle = 'black';
	ctx.textAlign = 'left';
	ctx.fillText('Name',85,72);
	ctx.textAlign = 'left';
	ctx.fillText('Score',450,72);
	ctx.fillText('Kills',550,72);
	ctx.fillText('Deaths',640,72);
	ctx.beginPath();
	ctx.moveTo(60,80);
	ctx.lineTo(740,80);
	ctx.stroke();
	ctx.font = '14pt Arial';
	var iter = 0;
	for (var l in leaderboards) {
		ctx.fillStyle = leaderboards[l].color;
		ctx.fillRect(70,90+(iter*20),16,16);
		ctx.fillStyle = 'black';
		ctx.fillText(leaderboards[l].name,90,105+(iter*20));
		ctx.fillText(leaderboards[l].score,450,105+(iter*20));
		ctx.fillText(leaderboards[l].kills,550,105+(iter*20));
		ctx.fillText(leaderboards[l].deaths,640,105+(iter*20));
		iter++;
	}
	drawPing();
}

function drawTeamScores() {
	ctx.globalAlpha = 0.7;
	ctx.strokeStyle = 'purple';
	ctx.lineWidth = 1;
	ctx.fillStyle = 'pink';
	ctx.fillRect(0,0,60,48);
	ctx.strokeRect(0,-1,60,49);

	ctx.strokeStyle = 'orange';
	ctx.lineWidth = 1;
	ctx.fillStyle = 'yellow';
	ctx.fillRect(canvas.width-60,0,60,48);
	ctx.strokeRect(canvas.width-60,0,60,48);

	ctx.globalAlpha = 1;
	ctx.fillStyle = 'black';
	ctx.font = '30pt Arial';
	ctx.textAlign = 'center';
	ctx.fillText(teams[1].kills,30,36);
	ctx.fillText(teams[2].kills,canvas.width-30,36);
}

function drawWeaponHud() {
	//Bottom left
	ctx.strokeStyle = 'brown';
	ctx.lineWidth = 1;
	ctx.fillStyle = 'tan';
	ctx.fillRect(0,canvas.height-35,200,35);
	ctx.strokeRect(0,canvas.height-35,200,35);
	ctx.textAlign = 'center';
	ctx.fillStyle = 'red';
	if (playerListSecure[myId].canAttack) {
		ctx.fillStyle = 'green';
	}
	ctx.font = '18pt Arial';
	ctx.fillText(weaponsList[curWeapon].name,100,canvas.height-7);

	//Top middle
	ctx.globalAlpha = 0.6;
	ctx.strokeStyle = '#272a2a';
	ctx.lineWidth = 2;
	ctx.fillStyle = '#b1b0b3';
	ctx.fillRect(120,0,560,48);
	ctx.strokeRect(120,-1,560,49);
	ctx.globalAlpha = 1;
	var counter = 0;
	var counterX = 0;
	var counterY = 1;
	ctx.font = '12pt Arial';
	//ctx.align = 'left';
	for (w in weaponsList) {
		if (playerListSecure[myId]) {
			counter++;
			counterX++;
			ctx.fillStyle='black';
			if (w==curWeapon) {
				ctx.fillStyle='teal';
			}
			ctx.fillText(counter + ':' + weaponsList[w].name,70+counterX*125,counterY*18);
			if (counterX % 4 == 0) {
				counterX = 0;
				counterY++;
			}
		}
	}
}

function drawMiniMap() {
	if (minimapReady) {
		ctx.drawImage(curMap.minimap,canvas.width*0.5-curMap.minimap.width*0.5,canvas.height*0.5-curMap.minimap.height*0.5+30);
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 2;
		ctx.strokeRect(canvas.width*0.5-curMap.minimap.width*0.5,canvas.height*0.5-curMap.minimap.height*0.5+30,curMap.minimap.width,curMap.minimap.height);
		ctx.fillStyle = 'black';
		ctx.textAlign = 'center';
		ctx.font = '30pt Arial';
		ctx.fillText(curMap.name,canvas.width*0.5,canvas.height*0.5-curMap.minimap.height*0.5+15);
	}
}

function drawGuns() {
	if (weaponIds.length == numGunsLoaded) {
		for (var p in playerListSecure) {
			if (p !== myId || playerListSecure[myId].alive) {
				var mouse = {
					x:playerListSecure[p].mouse.x-(canvas.width/2)+playerListSecure[p].x+playerListSecure[p].width/2,
					y:playerListSecure[p].mouse.y-(canvas.height/2)+playerListSecure[p].y+playerListSecure[p].height/2
				}
				var circle = {
					x:playerListSecure[p].x+playerListSecure[p].width/2,
					y:playerListSecure[p].y+playerListSecure[p].height/2,
					radius:Math.sqrt(Math.pow(mouse.x - playerListSecure[p].x,2) + Math.pow(mouse.x - playerListSecure[p].y,2))
				}
				var point = {
					x:mouse.x,
					y:mouse.y
				};
				var degrees = Math.atan2(point.y-circle.y,point.x-circle.x);
				ctx.save();
				ctx.translate(circle.x,circle.y);
				ctx.rotate(degrees+0.5*Math.PI);
				ctx.drawImage(weaponsList[playerListSecure[p].weapon].wpnSprite,-24,-24);
				ctx.restore();
			}
		}
	}
}

function update() {
	if (mapReady) {
	ctx.clearRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle=curMap.bgcolor;
		ctx.fillRect(0,0,canvas.width,canvas.height);
	}
	if (playerListSecure[myId]) {
		centerOfPlayer = {
			x:playerListSecure[myId].x+playerListSecure[myId].width*0.5,
			y:playerListSecure[myId].y+playerListSecure[myId].height*0.5
		}

		if (lastCursorPos.x != mousePos.x || lastCursorPos.y != mousePos.y) {
			lastCursorPos.x = mousePos.x;
			lastCursorPos.y = mousePos.y;
			socket.emit('new-mouse-pos',mousePos);
		}
	}
	//All things that are translated go here
	if (playerListSecure[myId]) {
		ctx.translate(canvas.width*0.5-centerOfPlayer.x,canvas.height*0.5-centerOfPlayer.y);
	}
	if (mapReady && playerListSecure[myId]) {
		drawMap();
		drawExtras();
	}
	drawBullets();
	drawPlayers();
	drawGuns();
	drawExplosions();
	drawBonuses();

	ctx.setTransform(1, 0, 0, 1, 0, 0);
	//All things that aren't translated go here
	if (playerListSecure[myId]) {
		if (playerListSecure[myId].alive == false) {
			ctx.fillStyle = 'black';
			ctx.strokeStyle = 'red';
			ctx.textAlign = 'center';
			ctx.font = '50pt Arial';
			ctx.fillText(Math.ceil((respawnTime-Date.now())/1000),canvas.width/2,canvas.height/2);
			ctx.strokeText(Math.ceil((respawnTime-Date.now())/1000),canvas.width/2,canvas.height/2);
		}
		if (!showLeaderboard) {
			drawWeaponHud();
		}
	}
	if (gameMode == 1) {
		drawTeamScores();
	}
	if (showLeaderboard) {
		drawLeaderboard();
	}
	if (showMinimap) {
		drawMiniMap();
	}
	requestAnimationFrame(update);
}

getCursorPosition = function(event) {
	var x, y;
	x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - Math.floor(canoffset.left) - 1;
	y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - Math.floor(canoffset.top) - 1;
	return {
		x:x,
		y:y
	};
}

//These fuckers made a built in function for ping and pong, so i have to rename it.
ping = function() {
	pingTime = Date.now();
	socket.emit('pang');
}
socket.on('peng', function() {
	latency = Date.now() - pingTime;
	setTimeout(ping,2000);
});