var connection = require('./connection');
var player = require('./player');

var gameWidth = 600;
var gameHeight = 600;
const unit = 10;

function game(io) {
    this.queue = {}
    this.players = {}
    this.started = false;
    this.io = io;
    this.startTime = null;

    var self = this;

    io.on('connection', function(socket) {
        self.checkGameStatus();
        self.socketListener(socket);
    });
}

function getPlayableCells() {
    let playableCells = new Set();
    for (let i = 0; i < gameWidth / unit; i++) {
        for (let j = 0; j < gameHeight / unit; j++) {
            playableCells.add(`${i * unit}x${j * unit}y`);
        };
    };
    return playableCells;
};

let playableCells = getPlayableCells();

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function randomStartPos() {
    var number = randomNumber(50, gameWidth-50);
    var remainder = number % unit;
    return number - remainder;
}

var colors = ["#CB3301", "#FF0066", "#FF6666", "#FEFF99", "#FFFF67", "#CCFF66", "#99FE00", "#EC8EED", "#FF99CB", "#FE349A", "#CC99FE", "#6599FF", "#03CDFF", "#FFFFFF"];
function randomColor() {
    return colors[Math.floor(Math.random()*colors.length)];
};

game.prototype.deletePlayer = function(id) {
    var p = this.players[id] || null;
    if (!p) {
        return;
    }

    // reactivate playable tiles
    p.tail.forEach(function (m) {
        playableCells.add(`${m.x}x${m.y}y`);
    });

    this.queue[id] = this.players[id];
    this.queue[id].loadPlayer(randomStartPos(), randomStartPos());
    delete this.players[id];
}

game.prototype.checkGameStatus = function() {
    if (this.started) {
        var playtime = (new Date().getTime() - this.startTime) / 1000;
            // delete inactive players
            for (let id in this.players) {
            if (this.players[id].movement == null && playtime > 5) {
                this.deletePlayer(id);
            }
        }
    }

    if (Object.keys(this.players).length <= 1) {
        for (let id in this.players) {
            this.queue[id] = this.players[id];
            this.queue[id].loadPlayer(randomStartPos(), randomStartPos());
            delete this.players[id];
        }

        this.started = false;
        playableCells = getPlayableCells();
    } 

    if (!this.started && this.readyCheck()) {
        this.startGame();
    }
}

game.prototype.addPlayer = function(id) {
    this.queue[id] = new player(randomStartPos(), randomStartPos(), randomColor(), unit);
}

game.prototype.startGame = function() {
    this.players = {};
    for (let id in this.queue) {
        if (this.queue[id].ready) {
            this.players[id] = this.queue[id];
            this.players[id].loadPlayer(this.queue[id].x, this.queue[id].y);
            delete this.queue[id];
        }
    }

    this.started = true;
    this.io.sockets.emit('game started');
}

game.prototype.readyCheck = function() {
    if (this.started) {
        return false;
    }
    
    let amountReady = 0;
    for (let id in this.queue) {
        if (!this.queue[id].ready) {
            start = false;
        } else {
            amountReady++;
        }
    }

    var startTimerDone = (this.startTime != null && new Date().getTime() >= this.startTime);

    if (startTimerDone && amountReady >= 2) {
        return true;
    } else if (startTimerDone) {
        // Timer done but not enough ready players
        if ((new Date().getTime() - this.startTime) < 1000) {
            this.io.sockets.emit('not enough players');
        }
        this.startTime = null;

        for (let id in this.queue) {
            this.queue[id].ready = false;
        }
    }

    return false;
}

game.prototype.socketListener = function(socket) {
    var self = this;
    socket.on('new player', function() {
        self.addPlayer(socket.id);
    });

    socket.on('ready', function() {
        var p = self.queue[socket.id] || null;
        if (p != null) {
            p.ready = true;

            if (self.startTime == null || self.startTime <= new Date().getTime()) {
                self.startTime = new Date().getTime() + 10000;
            }
        }

        self.checkGameStatus();
    });
    
    socket.on('movement', function(movement) {
        var p = self.players[socket.id] || null;
        if (p != null) {
            p.lastUpdate = new Date().getTime();
            self.checkGameStatus();

            if (!movement.up && !movement.right && !movement.down && !movement.left) {
                return;
            }

            p.movement = movement;

            if (!self.started) {
                return;
            }

            if (movement.left) {
                p.x -= unit;
            } else if (movement.up) {
                p.y -= unit;
            } else if (movement.right) {
                p.x += unit;
            } else if (movement.down) {
                p.y += unit;
            }

            if (!playableCells.has(`${p.x}x${p.y}y`) && !p.dead) {
                p.dead = true;
                p.x = randomStartPos();
                p.y = randomStartPos();
                self.queue[socket.id] = p;
                delete self.players[socket.id];
            }

            p.tail.push({
                x: p.x,
                y: p.y
            });

            playableCells.delete(`${p.x}x${p.y}y`);
        } else {
            var p = self.queue[socket.id] || null;
            if (p != null) {
                p.lastUpdate = new Date().getTime();
            }
            self.checkGameStatus();
        }
    });
}

module.exports = game;
