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
//  console.log(io.sockets.adapter.rooms);
//  socket.join("adam");
//  console.log(io.sockets.adapter.rooms);
//  console.log("");

//  if (Object.keys(players).length == 0) {
//    players[socket.id] = {
//      cards: null,
//      assassins: null
//    };
//  }
//
//  else if (Object.keys(players).length == 1) {
//    players[socket.id] = {
//      cards: null,
//      assassins: null
//    };
//    setup();
//  }

  socket.on('joinRoom', function(roomId) {
    console.log(roomId);
    socket.join(roomId);
    socket.leave(socket.id);
    var clients = io.sockets.adapter.rooms[roomId].sockets;
    console.log(clients);

    if (Object.keys(clients).length == 2) {
        console.log("room length is 2");
        setup(Object.keys(io.sockets.in(roomId)));
    }
    else if (Object.keys(clients).length > 2) {
        console.log("too many");
        console.log("There are already 2 players");
    }

  })

  socket.on('disconnect', function () {
    console.log('user disconnected');

    // doesn't matter if non-player disconnects
    if (Object.keys(players).includes(socket.id)) {
        players = {}; // game over
        io.emit('disconnect');
    }
  });

  socket.on('markGreen', function(cardId) {
    socket.broadcast.emit('markCardGreen', cardId);
  });

  socket.on('updateTurns', function(increase) {
    socket.broadcast.emit('updateTurnCounter', increase);
  });

});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

function setup(spyIDs) {
    players[spyIDs[0]] = {
      cards: null,
      assassins: null
    };
    players[spyIDs[1]] = {
      cards: null,
      assassins: null
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

    io.emit('initGrid', codeWords);
    io.to(spyIDs[0]).emit('initPlayerCard', players[spyIDs[0]]);
    io.to(spyIDs[1]).emit('initPlayerCard', players[spyIDs[1]]);
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
