function connection(socket) {

    socket.on('new player', function() {
        game.addPlayer(socket.id);
    });

    socket.on('movement', function(movement) {
        var p = players[socket.id] || {};
        
        try {
            p.move(movement);
        } catch (e) {}
    });

}

module.exports = connection;