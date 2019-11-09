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
  var kicked = false;
  var d = new Date().getTime();
  for (let key in g.players) {
    var p = g.players[key];
    if (d - p.lastUpdate > seconds * 1000) {
      kicked = true;
      g.deletePlayer(key);
      delete g.players[key];
      delete g.queue[key];
    }
  }

  for (let key in g.queue) {
    var p = g.queue[key];
    if (d - p.lastUpdate > seconds * 1000) {
      kicked = true;
      delete g.queue[key];
    }
  }

  return kicked;
}

setInterval(function() {
  var kicked = kickOlder(5);
  
  var startIn = 0;
  if (g.startTime) {
    startIn = Math.round((g.startTime - new Date().getTime())/1000);
  }
  if (kicked) {
    io.sockets.emit('kicked player');
  }

  io.sockets.emit('state', g.players, g.queue, startIn);
}, 1000 / 10);
