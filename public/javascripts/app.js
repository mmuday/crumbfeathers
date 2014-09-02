
$(function() {
	var playerId;
	var myName;
	var speed = 2;
	var lastX = 0;
	var lastY = 0;
	var playerWorldX = -1;
	var playerWorldY = -1;
	var screenXSize = 500;
	var screenYSize = 500;

	var players = {};
	var background;
	// create an new instance of a pixi stage
	var stage;
	// pixi renderer
	var renderer;

	var TEXT_OFFSET_Y = 105;

	var getTextX = function(sprite,text) {
		text.updateTransform();
		var offset = -(text.width /2);
		return sprite.position.x + offset;
	};

	var log = function(message) {
		$('#thread').append("<div>"+message+"</div>");
	}
	// ----------------------- Receive Message --------------------
	var receiveMessage = function (event) {
		var parsedEvent = JSON.parse(event);
		// ----------------- talk message ------------------
		if (parsedEvent.action == "TALK") {
			var message = "<div>" +
				"<span style='color:white;font-weight:bold;background-color:#" + parsedEvent.playerColor + "'>" + parsedEvent.playerName + "</span>" +
				"<span>" + parsedEvent.playerMessage + "</span>" +
				"</div>"
			$('#thread').append(message);

			var player = players[parsedEvent.playerId];
			var bubbleObject = makeSpeechBubble(parsedEvent.playerMessage);
			if (player.speechBubble) {
				stage.removeChild(player.text);
				stage.removeChild(player.speechBubble);
			}
			player.speechBubble = bubbleObject.speechBubble;
			player.text = bubbleObject.text;
			setTimeout(function() {
				if (player.speechBubble) {
					player.speechBubble.opacity = 0.9;
				}
			},5000);
		}
		// ----------------- join message ------------------
		if (parsedEvent.action == "JOIN") {
			console.log("Join!");
			console.log(parsedEvent);
			var message = "<div>" +
				"<span style='font-weight:bold;color:#" + parsedEvent.playerColor + "'>" + parsedEvent.playerName + "</span>" +
				"<span> joined.</span>" +
				"</div>";
			var me = parsedEvent.positions.find(function(player){return playerId == player.id});
			if (me) {
				playerWorldX = me.x;
				playerWorldY = me.y;
				lastX = me.x;
				lastY = me.y;
				console.log("setting ME");
			}
			$("#thread").append(message);
		}
		if (! players.keys) {
			players = Object.extended(players);
			players.keys(function(key){players[key].seen = false});
		}
		var bgOffsetX,bgOffsetY;
		parsedEvent.positions.each(function(player){
			var playerRecord = players[player.id];
			if (!playerRecord) {

				var texture = PIXI.Texture.fromImage("/public/images/"+player.icon);
				var sprite = new PIXI.Sprite(texture);
				sprite.anchor.x = 0.5;
				sprite.anchor.y = 0.5;

				var calculatedPos = calculateScreenPosition(playerWorldX,playerWorldY,player.x, player.y);

				sprite.position.x = calculatedPos.otherScreenX;
				sprite.position.y = calculatedPos.otherScreenY;
				bgOffsetX = calculatedPos.mapOffsetX;
				bgOffsetY = calculatedPos.mapOffsetY;
				stage.addChild(sprite);

				var text = new PIXI.Text(player.name, {font: "15px Snippet", fill: "white", align: "center"});
				stage.addChild(text);
				text.position.x = getTextX(sprite,text);
				text.position.y = player.screenY + TEXT_OFFSET_Y;

				playerRecord = {
					id:player.id,
					sprite: sprite,
					nameBadge: text
				}
				players[player.id] = playerRecord;
			}
			var calcPos = calculateScreenPosition(playerWorldX,playerWorldY,player.x,player.y);
			bgOffsetX = calcPos.mapOffsetX;
			bgOffsetY = calcPos.mapOffsetY;
			playerRecord.sprite.position.x = calcPos.otherScreenX;
			playerRecord.sprite.position.y = calcPos.otherScreenY;
			playerRecord.nameBadge.position.x = getTextX(playerRecord.sprite,playerRecord.nameBadge);
			playerRecord.nameBadge.position.y = player.screenY + TEXT_OFFSET_Y;
			if (playerRecord.speechBubble) {
				var textStuff = playerRecord.text;
				textStuff.position.x = calcPos.otherScreenX - textStuff.width / 2;
				textStuff.position.y = calcPos.otherScreenY - 105 - textStuff.height / 2;
				playerRecord.speechBubble.position.x = textStuff.position.x - 10;
				playerRecord.speechBubble.position.y = textStuff.position.y - 22;
			}
			playerRecord.seen = true;
		});
		if ("undefined" !== typeof(bgOffsetX)) {
			background.tilePosition.x = bgOffsetX;
			background.tilePosition.y = bgOffsetY;
		}
		players.keys()
			.filter(function(key){ return !players[key].seen; })
			.each(function(key){
				var oldChild = players[key].sprite;
				if (stage.children.indexOf(oldChild) != -1) {
					console.log("removing sprite");
					stage.removeChild(players[key].sprite);
				} else {
					console.log("not a child....")
				}
				delete players[key];
			});
	};

	var sendit = function () {
		var $textin = $("#textin");
		socket.send("playerId:" + playerId + ":TALK:" + $textin.val());
		$textin.val("");
	}

	var doLogin = function () {
		var userName = $("#userName").val().trim();
		if (userName != "") {
			myName = userName;
			$.ajax({
				type: "POST",
				url: joinUrl,
				data: { userName: userName },
				dataType: 'json',
				success: function (data) {
					playerId = data.id;
					$("#preJoinUi").slideUp();
					$("#joinedUi").slideDown();
					socket.send("playerId:" + playerId + ":JOIN");
					console.log("join sent successfully via socket");
				},
				error: function (jqXHR, textStatus, errorThrown) {
					console.log("Error", jqXHR, textStatus, errorThrown);
				}
			});
		}
	};


	function initializePixiAndBackground() {
		stage = new PIXI.Stage(0x66FF99);

		// create a renderer instance
		renderer = PIXI.autoDetectRenderer(screenXSize, screenYSize, $("#canvas")[0]);

		var backgroundTexture = new PIXI.Texture.fromImage("/public/images/background.jpg");
		background = new PIXI.TilingSprite(backgroundTexture, screenXSize, screenYSize);
		background.position.x = 0;
		background.position.y = 0;
		background.tilePosition.x = 0;
		background.tilePosition.y = 0;

		stage.addChild(background);
		requestAnimFrame(animate);
	}

	function calculateScreenPosition(playerWorldX,playerWorldY,otherWorldX,otherWorldY) {
		var screenX = screenXSize/2;
		var screenY = screenYSize/2;
		var mapOffsetX;
		var mapOffsetY;
		if (playerWorldX < screenXSize/2) {
			screenX = playerWorldX;
			mapOffsetX = 0;
		} else {
			mapOffsetX = -(playerWorldX - screenXSize/2);
		}
		if (playerWorldY < screenYSize / 2) {
			screenY = playerWorldY;
			mapOffsetY = 0;
		} else {
			mapOffsetY = -(playerWorldY - screenYSize/2);
		}
		// TODO - deal with the other side of the world;


		var otherScreenX = screenX + (otherWorldX - playerWorldX);
		var otherScreenY = screenY + (otherWorldY - playerWorldY);

		return {
			screenX: screenX,
			screenY: screenY,
			mapOffsetX: mapOffsetX,
			mapOffsetY: mapOffsetY,
			otherScreenX: otherScreenX,
			otherScreenY: otherScreenY
		}
	}

	function handlePositions() {
		var pos = calculateScreenPosition(worldX,worldY);
		sprite.position.x = pos.screenX;
		sprite.position.y = pos.screenY;
		background.tilePosition.x = pos.mapOffsetX;
		background.tilePosition.y = pos.mapOffsetY;

	}

	function handleKeyboard(message) {
		if (!playerId) {
			return;
		}
		var playerRecord = players[playerId];
		if (!playerRecord) {
			return;
		}
		var sprite = playerRecord.sprite;
		var nameBadge = playerRecord.nameBadge;
		if (message.indexOf("up") != -1) {
			playerWorldY -= speed;
		}
		if (message.indexOf("down") != -1) {
			playerWorldY += speed;
		}
		if (message.indexOf("left") != -1) {
			playerWorldX -= speed;
		}
		if (message.indexOf("right") != -1) {
			playerWorldX += speed;
		}
		nameBadge.position.x = getTextX(sprite,nameBadge);
		nameBadge.position.y = sprite.position.y + TEXT_OFFSET_Y;
		if (lastX != playerWorldX || lastY != playerWorldY) {
			lastX = playerWorldX;
			lastY = playerWorldY;
			sendMove(lastX,lastY);
		}
	}

	var moveIndex = 0;
	function sendMove(xpos,ypos) {
		moveIndex++;
		if (moveIndex % 2 == 0) {
			var message = "playerId:" + playerId + ":MOVE:" + xpos + ":" + ypos;
			socket.send(message);
		}
	};

	function handleSpeechFadeouts() {
		if (!players.keys) {
			players = Object.extended(players);
		}
		players.keys().each(function(key){
			var player = players[key];
			var speechBubble = player.speechBubble;
			var text = player.text;
			if (speechBubble) {
				if (speechBubble.opacity && speechBubble.opacity < 1) {
					if (speechBubble.opacity < .0001) {
						stage.removeChild(text);
						stage.removeChild(speechBubble);
						delete player.speechBubble;
					} else {
						var newOpacity = speechBubble.opacity * 0.93;
						speechBubble.opacity = newOpacity;
						text.opatory = newOpacity;
					}
				}
			}
		});
	}

	function makeSpeechBubble(textMessage) {
		// TODO I don't like the way this is--we have to construct the text object twice
		var text = new PIXI.Text(textMessage, {font: "15px Snippet", fill: "white", align: "center", wordWrap:true, wordWrapWidth:214});
		text.position.x = 200 - text.width / 2;
		text.position.y = 150 + offsety - text.height /2;

		var graphics = new PIXI.Graphics();
		graphics.beginFill(0xefefef);
		graphics.lineStyle(3, 0xdddddd, 1);
		var offsety = -105;
		graphics.drawRoundedRect(0,15,text.width+20,11 + text.height,5);
		graphics.endFill();

		stage.addChild(graphics);

		text = new PIXI.Text(textMessage, {font: "15px Snippet", fill: "ccc", align: "center", wordWrap:true, wordWrapWidth:214});
		text.position.x = 200 - text.width / 2;
		text.position.y = 150 + offsety - text.height /2;

		log("text width is" + text.width);
		log("text height is" + text.height);
		stage.addChild(text);
		return {speechBubble:graphics,text:text};
	}

	function animate() {
		requestAnimFrame(animate);
		var message = KeyboardJS.activeKeys();
		handleKeyboard(message);
		handleSpeechFadeouts();
		// render the stage
		renderer.render(stage);
	}


	function initFonts() {
		// Load them google fonts before starting...!
		WebFontConfig = {
			google: {
				families: [ 'Snippet' ]
			},

			active: function () {
			}
		};
		(function () {
			var wf = document.createElement('script');
			wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
				'://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
			wf.type = 'text/javascript';
			wf.async = 'true';
			var s = document.getElementsByTagName('script')[0];
			s.parentNode.insertBefore(wf, s);
		})();
	}

	// ---------------------------- click handlers -------------------

	socket.onmessage = function (event) {
		receiveMessage(event.data);
	}

//	$("#gobutton").click(sendit);

	$("#textForm").submit(function (e) {
		e.preventDefault();
		sendit();
	});

	$("#loginForm").submit(function(e) {
		e.preventDefault();
		doLogin();
	});

//	$("#joinButton").click(doLogin);

	// ---------------------------- initialize ----------------------
	initFonts();
	initializePixiAndBackground();
	window.calc = calculateScreenPosition;
});
