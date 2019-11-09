function player(x, y, color, unit) {
	this.loadPlayer(x, y, color);
	this.color = color || '#fff';
	this.unit = unit;
	this.lastUpdate = new Date().getTime();
}

player.prototype.loadPlayer = function (x, y) {
    this.dead = false;
    this.x = x;
	this.y = y;
	this.movement = null;
	this.ready = false;
	this.tail = [];
	this.score = 0;
}

module.exports = player;