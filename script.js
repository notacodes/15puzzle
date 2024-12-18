const puzzleContainer = document.querySelector("#puzzle-container");
let puzzle = [];
let size = 6;
let tilesize = 100;

puzzleContainer.style.width = `${size * tilesize}px`;
puzzleContainer.style.height = `${size * tilesize}px`;

generatePuzzle();
do {
    randomizePuzzle();
} while (!isPuzzleValid() || !validateEmptyPuzzle());
renderPuzzle();
console.log(puzzle);
handleInput();



function getRow(pos) {
    return Math.ceil(pos / size);
}

function getCol(pos) {
    const col = pos % size;
    return col === 0 ? size : col;
}

function generatePuzzle() {
    for (let i = 1; i <= size * size; i++) {
        puzzle.push({
            value: i,
            position: i,
            x: (getCol(i) - 1) * tilesize, // Adjusted to match new size
            y: (getRow(i) - 1) * tilesize, // Adjusted to match new size
            disabled: false,
        });
    }
}

function renderPuzzle() {
    puzzleContainer.innerHTML = "";
    for (let puzzleItem of puzzle) {
        const tile = document.createElement("wired-button");
        tile.classList.add("puzzle-item");
        tile.style.left = `${puzzleItem.x}px`;
tile.style.top = `${puzzleItem.y}px`;
        tile.innerText = puzzleItem.disabled ? "" : puzzleItem.value;

        if (puzzleItem.disabled) tile.classList.add("empty");

        tile.addEventListener("click", () => handleTileClick(puzzleItem));
        puzzleContainer.appendChild(tile);
    }
}


function randomizePuzzle() {
    const randomValues = getRandomValues();
    let i = 0;

    for (let puzzleItem of puzzle) {
        puzzleItem.value = randomValues[i];
        puzzleItem.disabled = false;
        i++;
    }

    const emptyPuzzle = puzzle.find((item) => item.value === size * size);
    emptyPuzzle.disabled = true;
}

function getRandomValues() {
    const values = Array.from({ length: size * size }, (_, i) => i + 1);
    return values.sort(() => Math.random() - 0.5);
}


function handleInput() {
    document.addEventListener("keydown", handleKeyDown);
}

function handleTileClick(clickedTile) {
    const emptyTile = getEmptyPuzzle();
    moveTileIfValid(clickedTile, emptyTile);
}

function handleKeyDown(e) {
    const emptyTile = getEmptyPuzzle();
    let neighbor;
    switch (e.key) {
        case "ArrowLeft":
            neighbor = getTileByPosition(emptyTile.position + 1, getCol(emptyTile.position) < size);
            break;
        case "ArrowRight":
            neighbor = getTileByPosition(emptyTile.position - 1, getCol(emptyTile.position) > 1);
            break;
        case "ArrowUp":
            neighbor = getTileByPosition(emptyTile.position + size, getRow(emptyTile.position) < size);
            break;
        case "ArrowDown":
            neighbor = getTileByPosition(emptyTile.position - size, getRow(emptyTile.position) > 1);
            break;
    }
    if (neighbor) moveTileIfValid(neighbor, emptyTile);
}

function moveTileIfValid(tile, emptyTile) {
    const isAdjacent = Math.abs(tile.x - emptyTile.x) + Math.abs(tile.y - emptyTile.y) === tilesize;
    if (isAdjacent) {
        [tile.x, emptyTile.x] = [emptyTile.x, tile.x];
        [tile.y, emptyTile.y] = [emptyTile.y, tile.y];
        [tile.position, emptyTile.position] = [emptyTile.position, tile.position];
        renderPuzzle();
        if (isPuzzleSolved() === true) alert("Congratulations! You solved the puzzle!");
    }
}


function getTileByPosition(pos, condition) {
    return condition ? puzzle.find((tile) => tile.position === pos) : null;
}

function getEmptyPuzzle() {
    return puzzle.find((tile) => tile.disabled);
}

function isPuzzleValid() {
    let inversions = 0;
    const values = puzzle.map((item) => item.value);
    for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
            if (values[i] > values[j] && values[i] !== size * size) inversions++;
        }
    }
    return size % 2 === 1 ? inversions % 2 === 0 : inversions % 2 === 1;
}

function validateEmptyPuzzle() {
    return puzzle.filter((item) => item.disabled).length === 1;
}

function isPuzzleSolved() {
    for (let i = 0; i < puzzle.length; i++) {
        console.log(puzzle[i].value);
        if (puzzle[i].value !== puzzle[i].position) {
            return false;
        }
    }
    return true;
}
