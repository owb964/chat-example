var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var fs = require('fs');

var players = {};

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('joinRoom', function(roomId) {
    socket.join(roomId);
    var clients = io.sockets.adapter.rooms[roomId].sockets;
    var rooms = Object.keys(io.sockets.adapter.sids[socket.id]);

    // don't let player be in more than 2 rooms
    if (rooms.length > 2) {
        var room = rooms[0] == socket.id ? rooms[1] : rooms[0];
        socket.leave(room);
    }

    if (Object.keys(clients).length < 2) {
        // do nothing
        io.to(socket.id).emit("showSpinner", roomId);
    }

    else if (Object.keys(clients).length == 2) {
        console.log("room length is 2");
        setup(Object.keys(clients), socket, roomId);
    }

    else {
        console.log("too many");
        io.to(socket.id).emit("codeTaken");
        socket.leave(roomId); // kick 'em out
    }
  })

  socket.on('disconnect', function () {
    console.log('user disconnected');

    if (!(socket.id in players)) {
        console.log("not a player");
        return;
    }

    var room = players[socket.id].room;
    console.log(room);
    var roomObj = io.sockets.adapter.rooms[room];
    var remainingSockets = Object.keys(roomObj.sockets);
    console.log(remainingSockets)
    remainingSockets.forEach(id => delete players[id]);
    io.to(room).emit('disconnect', room);
    delete players[socket.id]; // delete player that originally disconnected
  });

  socket.on('abandoned', function(roomId) {
    socket.leave(roomId);
  });

  socket.on('markGreen', function(cardId) {
    var rooms = Object.keys(socket.rooms);
    var room = rooms[0] == socket.id ? rooms[1] : rooms[0];
    socket.to(room).emit('markCardGreen', cardId);
  });

  socket.on('updateTurns', function(increase) {
    var rooms = Object.keys(socket.rooms);
    var room = rooms[0] == socket.id ? rooms[1] : rooms[0];
    socket.to(room).emit('updateTurnCounter', increase);
  });

});

http.listen(port, function() {
  console.log('listening on *:' + port);
});

function setup(spyIDs, socket, roomId) {
    players[spyIDs[0]] = {
      cards: null,
      assassins: null,
      room: roomId
    };
    players[spyIDs[1]] = {
      cards: null,
      assassins: null,
      room: roomId
    };

    var text = fs.readFileSync("public/assets/words.txt", "utf-8");
    var allWords = text.split("\u21b5").join('');
    var allWords = text.split("\n");

    // set up the codewords
    var bound = allWords.length;
    var codeWords = [];
    for (var i = 0; i < 25; i++) {
      var index = Math.floor(Math.random() * bound);
      codeWords.push(allWords[index]);
      allWords[index] = allWords[bound-1];
      bound--;
    }

    var spy1Cards = [], spy2Cards = [];
    var indices =  [];
    for (i = 0; i < 25; i++) {
        indices.push(i);
    }

    // pick the 3 common green cards
    bound = 25;
    for (i = 0; i < 3; i++) {
      var index = Math.floor(Math.random() * bound);
      spy1Cards.push(indices[index]);
      spy2Cards.push(indices[index]);
      indices[index] = indices[bound-1];
      bound--;
    }

    // pick 12 green cards
    for (i = 0; i < 12; i++) {
      var index = Math.floor(Math.random() * bound);
      if (i % 2 == 0)
        spy1Cards.push(indices[index]);
      else
        spy2Cards.push(indices[index]);
      indices[index] = indices[bound-1];
      bound--;
    }
    spy1Cards.sort(function(a, b) {
        return a - b;
    });
    spy2Cards.sort(function(a, b) {
        return a - b;
    });
    players[spyIDs[0]].cards = spy1Cards;
    players[spyIDs[1]].cards = spy2Cards;

    players[spyIDs[0]].assassins = pickAssassins(spy1Cards);
    players[spyIDs[1]].assassins = pickAssassins(spy2Cards);
    console.log(players);

    var rooms1 = Object.keys(io.sockets.adapter.sids[spyIDs[0]]);
    var rooms2 = Object.keys(io.sockets.adapter.sids[spyIDs[1]]);
    var commonRoom = findCommonRoom(rooms1, rooms2);

    io.to(commonRoom).emit('initGrid', codeWords);
    io.to(spyIDs[0]).emit('initPlayerCard', players[spyIDs[0]]);
    io.to(spyIDs[1]).emit('initPlayerCard', players[spyIDs[1]]);
}

function findCommonRoom(rooms1, rooms2) {
    for (var i = 0; i < rooms1.length; i++) {
        let currRoom = rooms1[i];
        if (rooms2.includes(currRoom)) {
            return currRoom;
        }
    }
    return null;
}

function pickAssassins(cards) {
    var choices = [], cardIndex = 0, choiceIndex = 0;
    while (choiceIndex < 25) {
        if (cardIndex < cards.length && choiceIndex < cards[cardIndex]) {
            choices.push(choiceIndex);
        } else if (cardIndex < cards.length && choiceIndex == cards[cardIndex]) {
            cardIndex++;
        } else {
            choices.push(choiceIndex);
        }
        choiceIndex++;
    }

    var assassins = [];
    var bound = choices.length;
    for (var i = 0; i < 3; i++) {
        var index = Math.floor(Math.random() * bound);
        assassins.push(choices[index]);
        choices[index] = choices[bound-i-1];
    }
    assassins.sort(function(a, b) {
        return a - b;
    });
    return assassins;
}
