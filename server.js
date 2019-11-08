// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var Player = require('./models/player');
var game = require('./models/game');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(5000, function() {
  console.log('Starting server on port 5000');
});

var g = new game(io);

function kickOlder(seconds) {
  var d = new Date().getTime();
  for (let key in g.players) {
    var p = g.players[key];
    if (d - p.lastUpdate > seconds * 1000) {
      delete g.players[key];
    }
  }

  for (let key in g.queue) {
    var p = g.queue[key];
    if (d - p.lastUpdate > seconds * 1000) {
      delete g.queue[key];
    }
  }
}

setInterval(function() {
  kickOlder(5);
  
  io.sockets.emit('state', g.players, g.queue);
}, 1000 / 10);
