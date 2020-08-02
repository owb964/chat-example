var board = document.querySelector('.game-board');
var playerCard = document.querySelector('.player-card');
var button = document.getElementById('clearButton');

function setupGame() {
    var socket = io();

    socket.on("disconnect", function() {
        clear();
    });

    socket.on('initPlayerCard', function(data) {
        console.log("init player card");
        console.log(data);
        addDivsToPlayerCards(data);
    });

    socket.on('initGrid', function(codeWords) {
        console.log("init grid");
        console.log(codeWords);
        addDivsToGameBoard(codeWords);
    });
}

function addDivsToGameBoard(codeWords) {
    var gridCellDimensions = ((600 / 5) - 2).toFixed(2);
    var gridSize = 25;

    // create grid squares & add to board
    var wordCounter = 0;
    while (gridSize > 0) {
        var newDiv = document.createElement('div');
        newDiv.textContent = codeWords[wordCounter];
        board.appendChild(newDiv);
        newDiv.classList.add('grid');
        newDiv.style.height = gridCellDimensions + 'px';
        newDiv.style.width = gridCellDimensions + 'px';
        newDiv.style.border = '1px solid black';

        gridSize--;
        wordCounter++;
    }

    var gridCells = document.querySelectorAll('.grid');
    gridCells.forEach(cell => cell.addEventListener('click', changeColor));
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

// change grid square color to red
function changeColor() {
    var socket = io();
    socket.emit('clickedSquare', "something");
    this.style.backgroundColor = '#ff9999';
}

// clear grid + prompt for new grid size
function clear() {
    while (board.hasChildNodes()) {
        board.removeChild(board.lastChild); // removes all grid squares
    }
}

button.addEventListener('click', clear);
window.onload = setupGame();