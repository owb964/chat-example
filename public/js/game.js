var board = document.querySelector('.game-board');
var playerCard = document.querySelector('.player-card');
var socket = io();

function setupGame() {
    socket.on("disconnect", function() {
        clear();
    });

    socket.on('initPlayerCard', function(data) {
        console.log("init player card");
        console.log(data);
        addDivsToPlayerCards(data);
    });

    socket.on('initGrid', function(codeWords, socket) {
        console.log("init grid");
        console.log(codeWords);
        addDivsToGameBoard(codeWords, socket);
    });

    socket.on('markCardGreen', function(id) {
        console.log(id);
        var card = document.getElementById(id);
        var greenId = "green-" + id.substring(id.indexOf('-') + 1);
        var greenCheckbox = document.getElementById(greenId);
        console.log(greenCheckbox);
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
    var gridCellDimensions = ((600 / 5) - 2).toFixed(2);
    var gridSize = 25;

    // create grid squares & add to board
    var wordCounter = 0;
    while (gridSize > 0) {
        var newDiv = document.createElement('div');
        newDiv.id = "card-" + wordCounter;
        newDiv.textContent = codeWords[wordCounter];
        board.appendChild(newDiv);
        newDiv.classList.add('grid');
        newDiv.style.height = gridCellDimensions + 'px';
        newDiv.style.width = gridCellDimensions + 'px';
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
        civLabel.appendChild(document.createTextNode('civ'));
        civDiv.appendChild(civCheckbox);
        civDiv.appendChild(civLabel);

        newDiv.appendChild(civDiv);
        newDiv.appendChild(document.createElement("br"));
        civCheckbox.addEventListener("change", clickCivilian);

        gridSize--;
        wordCounter++;
    }

    var gridCells = document.querySelectorAll('.grid');
    console.log(gridCellDimensions);
}

function addDivsToPlayerCards(playerData) {
    var gridCellDimensions = ((150 / 5) - 2).toFixed(2);
    var gridSize = 25;

    const cards = playerData.cards;
    cards.sort(function(a, b) {
        return a - b;
    });
    const asses = playerData.assassins;
    asses.sort(function(a, b) {
        return a - b;
    });

    var cardIndex = 0, assIndex = 0, gridCounter = 0;
    // create grid squares & add to player card
    console.log("cards: " + cards);
    console.log("assassins: " + asses);
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

    var gridCells = document.querySelectorAll('.grid');
    console.log(gridCellDimensions);
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
    console.log(cardId);
    socket.emit('markGreen', cardId);
}

window.onload = setupGame();