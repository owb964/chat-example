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
    socket.broadcast.emit('markCardGreen', cardId);
  });

  socket.on('updateTurns', function(increase) {
    socket.broadcast.emit('updateTurnCounter', increase);
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
    spy1Cards.sort(function(a, b) {
        return a - b;
    });
    spy2Cards.sort(function(a, b) {
        return a - b;
    });
    spies[spyIDs[0]].cards = spy1Cards;
    spies[spyIDs[1]].cards = spy2Cards;

    spies[spyIDs[0]].assassins = pickAssassins(spy1Cards);
    spies[spyIDs[1]].assassins = pickAssassins(spy2Cards);

    io.emit('initGrid', codeWords);
    io.to(spyIDs[0]).emit('initPlayerCard', spies[spyIDs[0]]);
    io.to(spyIDs[1]).emit('initPlayerCard', spies[spyIDs[1]]);
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
    console.log("assassins: " + assassins);
    return assassins;
}
