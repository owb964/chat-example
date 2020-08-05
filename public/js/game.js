var board = document.querySelector('.game-board');
var playerCard = document.querySelector('.player-card');
var socket = io();

function setupGame() {
    $('button').click(function(e) {
        var button_classes, value = +$('.counter').val();
        button_classes = $(e.currentTarget).prop('class');
        if (button_classes.indexOf('up_count') !== -1) {
            value++;
            socket.emit('updateTurns', true);
            $('.counter').val(value);
        } else {
            if (value > 0) {
                value--;
                socket.emit('updateTurns', false);
                $('.counter').val(value);
            }
        }
    });

    socket.on('updateTurnCounter', function(increase) {
        var curr = parseInt($('.counter').val());
        if (increase) {
            $('.counter').val(curr + 1);
        } else {
            if (curr > 0) $('.counter').val(curr - 1);
        }
    });

    socket.on("disconnect", function() {
        clear();
    });

    socket.on('initPlayerCard', function(data) {
        addDivsToPlayerCards(data);
    });

    socket.on('initGrid', function(codeWords, socket) {
        addDivsToGameBoard(codeWords, socket);
    });

    socket.on('markCardGreen', function(id) {
        var card = document.getElementById(id);
        var greenId = "green-" + id.substring(id.indexOf('-') + 1);
        var greenCheckbox = document.getElementById(greenId);
        if (greenCheckbox.checked) {
            greenCheckbox.checked = false;
            card.style.backgroundColor = '#FFFFFF';
        } else {
            greenCheckbox.checked = true;
            card.style.backgroundColor = '#39FF14';
        }
    });
}

function addDivsToGameBoard(codeWords) {
    var height = ((600 / 5) - 2).toFixed(2);
    var width = ((800 / 5) - 2).toFixed(2);
    var gridSize = 25;

    // create grid squares & add to board
    var wordCounter = 0;
    while (gridSize > 0) {
        var newDiv = document.createElement('div');
        newDiv.id = "card-" + wordCounter;
        newDiv.textContent = codeWords[wordCounter];
        board.appendChild(newDiv);
        newDiv.classList.add('grid');
        newDiv.style.height = height + 'px';
        newDiv.style.width = width + 'px';
        newDiv.style.border = '1px solid black';
        newDiv.appendChild(document.createElement("br"));
        newDiv.appendChild(document.createElement("br"));

        var greenDiv = document.createElement('div');
        var greenCheckbox = document.createElement('input');
        greenCheckbox.type = "checkbox";
        greenCheckbox.checked = false;
        greenCheckbox.id = "green-" + wordCounter;
        var greenLabel = document.createElement('label');
        greenLabel.setAttribute("for", greenCheckbox.id);
        greenLabel.style.fontSize = '10px';
        greenLabel.appendChild(document.createTextNode('green'));
        greenDiv.appendChild(greenCheckbox);
        greenDiv.appendChild(greenLabel);

        newDiv.appendChild(greenDiv);
        greenCheckbox.addEventListener("change", clickGreen);
        
        var civDiv = document.createElement('div');
        var civCheckbox = document.createElement('input');
        civCheckbox.type = "checkbox";
        civCheckbox.checked = false;
        civCheckbox.id = "civ-" + wordCounter;
        var civLabel = document.createElement('label');
        civLabel.setAttribute("for", civCheckbox.id);
        civLabel.style.fontSize = '10px';
        civLabel.appendChild(document.createTextNode('civilian'));
        civDiv.appendChild(civCheckbox);
        civDiv.appendChild(civLabel);

        newDiv.appendChild(civDiv);
        newDiv.appendChild(document.createElement("br"));
        civCheckbox.addEventListener("change", clickCivilian);

        gridSize--;
        wordCounter++;
    }
}

function addDivsToPlayerCards(playerData) {
    var gridCellDimensions = ((150 / 5) - 2).toFixed(2);
    var gridSize = 25;

    const cards = playerData.cards;
    const asses = playerData.assassins;

    var cardIndex = 0, assIndex = 0, gridCounter = 0;
    // create grid squares & add to player card
    while (gridSize > 0) {
        var newDiv = document.createElement('div');
        playerCard.appendChild(newDiv);
        newDiv.classList.add('grid');
        newDiv.style.height = gridCellDimensions + 'px';
        newDiv.style.width = gridCellDimensions + 'px';
        newDiv.style.border = '1px solid black';

        if (cardIndex < cards.length && gridCounter == cards[cardIndex]) {
            newDiv.style.backgroundColor = '#228B22';
            cardIndex++;
        }
        else if (assIndex < asses.length && gridCounter == asses[assIndex]) {
            newDiv.style.backgroundColor = '#000000';
            assIndex++;
        }
        gridSize--;
        gridCounter++;
    }
}

function clickCivilian() {
    if (!this.checked) {
        this.parentNode.parentNode.style.backgroundColor = '#FFFFFF';
    } else {
        this.parentNode.parentNode.style.backgroundColor = '#F5F5DC';
    }
}

function clickGreen() {
    if (!this.checked) {
        this.parentNode.parentNode.style.backgroundColor = '#FFFFFF';
    } else {
        this.parentNode.parentNode.style.backgroundColor = '#39FF14';
    }

    var cardId = this.parentNode.parentNode.id;
    socket.emit('markGreen', cardId);
}

function clear() {
    while (board.hasChildNodes()) {
        board.removeChild(board.lastChild); // removes all grid squares
    }
    while (playerCard.hasChildNodes()) {
        playerCard.removeChild(playerCard.lastChild);
    }
}

function enterRoom() {
    var roomId = document.getElementById("room-id").value.trim();
    socket.emit('joinRoom', roomId);
}

window.onload = setupGame();
