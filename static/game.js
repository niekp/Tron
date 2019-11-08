var socket = io();

var movement = {
	up: false,
	down: false,
	left: false,
	right: false
};

function setMovement(keycode) {
	if ([65, 87, 68, 83].indexOf(event.keyCode) < 0) {
		return;
	}
	
	var current = {...movement};
	movement.up = false;
	movement.down = false;
	movement.left = false;
	movement.right = false;
	
	switch (event.keyCode) {
		case 65: // A
			if (current.right) {
				movement.right = true;
				break;
			}
			movement.left = true;
			break;
		case 87: // W
			if (current.bottom) {
				movement.bottom = true;
				break;
			}
			movement.up = true;
			break;
		case 68: // D
			if (current.left) {
				movement.left = true;
				break;
			}
			movement.right = true;
			break;
		case 83: // S
			if (current.up) {
				movement.up = true;
				break;
			}
			movement.down = true;
			break;
	}
}

document.addEventListener('keydown', function(event) {
	setMovement(event.keyCode);
});

var movementInterval = null;
socket.emit('new player');
movementInterval = setInterval(function() {
	socket.emit('movement', movement);
}, 1000 / 60);

var canvas = document.getElementById('tron');
canvas.width = 750;
canvas.height = 750;

var ctx = canvas.getContext('2d');
const unit = 10;

function drawBackground() {
	ctx.strokeStyle = '#001900';
	for (let i = 0; i <= canvas.width / unit + 2; i += 1) {
	  for (let j = 0; j <= canvas.height / unit + 2; j += 1) {
		ctx.strokeRect(0, 0, unit * i, unit * j);
	  };
	};
};

function resetScreen() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, 750, 750);
	drawBackground();	
	readyButtonVisible = false;
}

var readyButtonVisible = false;
socket.on('state', function(players, queue) {
	drawBackground();

	for (var id in players) {
		var p = players[id];

		ctx.fillStyle = p.color;
		ctx.fillRect(p.x, p.y, unit, unit);
		p.tail.forEach(function (m) {
			ctx.fillRect(m.x, m.y, unit, unit);
		});
		
	}


	if (!socket.hasOwnProperty("id") || !socket.id) {
		return;
	}

	ctx.font = "14px Arial";

	ctx.fillStyle = "black";
	if (queue[socket.id]) {
		ctx.fillStyle = queue[socket.id].color;
	}
	
	ctx.fillRect(0, 0, 750, 15);
	ctx.fillStyle = "white";
	ctx.fillText("Spelers: " + Object.keys(players).length, 10, 10);

	ctx.fillStyle = "white";
	ctx.fillText("Wachtrij: " + Object.keys(queue).length, 80, 10);
	

	if (!Object.keys(players).length && Object.keys(queue).length >= 2 && queue[socket.id] && !queue[socket.id].ready) {
		// Teken start knop
		ctx.beginPath();
		ctx.rect(startButton.x, startButton.y, startButton.width, startButton.height);
		ctx.fillStyle = "green";
		ctx.fill();
		ctx.fillStyle = "white";
		ctx.font = "30px Arial";
		ctx.fillText("Ready", startButton.x+30, startButton.y+35);
		readyButtonVisible = true;
	} else if (readyButtonVisible) {
		resetScreen();
	}
});


// Start knop

function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function isInside(pos, rect){
    return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y
}

var startButton = {
    x: 300,
    y: 100,
    width: 150,
    height: 50
};

canvas.addEventListener('click', function(evt) {
    var mousePos = getMousePos(canvas, evt);

    if (isInside(mousePos, startButton)) {
		movement.up = movement.right = movement.down = movement.left = false;
		socket.emit('ready');
		resetScreen();
    }
}, false);