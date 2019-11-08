var socket = io();

var movement = {
	up: false,
	down: false,
	left: false,
	right: false
};

function setMovement(keycode) {
	if ([65, 87, 68, 83, 37, 38, 39, 40].indexOf(keycode) < 0) {
		return;
	}
	
	var current = {...movement};
	movement.up = false;
	movement.down = false;
	movement.left = false;
	movement.right = false;

	switch (keycode) {
		case 65: // A
		case 37: // <
			if (current.right) {
				movement.right = true;
				break;
			}
			movement.left = true;
			break;
		case 87: // W
		case 38: // ^
			if (current.bottom) {
				movement.bottom = true;
				break;
			}
			movement.up = true;
			break;
		case 68: // D
		case 39: // >
			if (current.left) {
				movement.left = true;
				break;
			}
			movement.right = true;
			break;
		case 83: // S
		case 40: // v
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
}, 1000 / 10);

var canvas = document.getElementById('tron');
canvas.width = 600;
canvas.height = 600;

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
	ctx.fillRect(0, 0, canvas.width, canvas.height);
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
			ctx.fillRect(m.x+1, m.y+1, (unit-2), (unit-2));
		});
	}

	if (!socket.hasOwnProperty("id") || !socket.id) {
		return;
	}
	var queued = !!queue[socket.id];

	ctx.font = "14px Arial";

	ctx.fillStyle = "black";
	if (queued)
		ctx.fillStyle = queue[socket.id].color;
	ctx.fillRect(0, 0, canvas.width, 15);
	ctx.fillStyle = "white";
	
	if (queued)
		ctx.fillStyle = "black";

	ctx.fillText("Spelers: " + Object.keys(players).length, 10, 10);
	ctx.fillText("Wachtrij: " + Object.keys(queue).length, 80, 10);
	

	if (!Object.keys(players).length && Object.keys(queue).length >= 2 && queue[socket.id] && !queue[socket.id].ready) {
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
    x: ((canvas.width/2)-75),
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