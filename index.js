var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var fs = require('fs');

var spies = {};

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  console.log('a user connected');

  if (Object.keys(spies).length == 0) {
    spies[socket.id] = {
      cards: null,
      assassins: null
    };
  }

  else if (Object.keys(spies).length == 1) {
    spies[socket.id] = {
      cards: null,
      assassins: null
    };
    setup();
  }

  socket.on('disconnect', function () {
    console.log('user disconnected');

    // doesn't matter if non-player disconnects
    if (Object.keys(spies).includes(socket.id)) {
        spies = {}; // game over
        io.emit('disconnect');
    }
  });

  socket.on('markGreen', function(cardId) {
    console.log(cardId);
    socket.broadcast.emit('markCardGreen', cardId);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

function setup() {
    var spyIDs = Object.keys(spies);
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
    spies[spyIDs[0]].cards = spy1Cards;
    spies[spyIDs[1]].cards = spy2Cards;

    // pick assassins
    var spy1Asses = [], spy2Asses = [];
    var indicesCopy = [...indices];
    var boundCopy = bound;
    for (i = 0; i < 3; i++) {
      var index = Math.floor(Math.random() * bound);
      var index2 = Math.floor(Math.random() * bound);
      spy1Asses.push(indices[index]);
      spy2Asses.push(indicesCopy[index2]);
      indices[index] = indices[bound-1];
      indicesCopy[index2] = indicesCopy[bound-1];
      bound--;
    }
    spies[spyIDs[0]].assassins = spy1Asses;
    spies[spyIDs[1]].assassins = spy2Asses;

    io.emit('initGrid', codeWords);
    io.to(spyIDs[0]).emit('initPlayerCard', spies[spyIDs[0]]);
    io.to(spyIDs[1]).emit('initPlayerCard', spies[spyIDs[1]]);

    console.log(spies);
}
