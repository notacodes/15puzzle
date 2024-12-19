const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

let lobbies = {};  // Verwaltet alle Lobbys
let puzzles = {};  // Speichert die Puzzlezustände für jede Lobby

// Generiert zufällige Lobby-Codes
function generateLobbyCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

wss.on('connection', ws => {
    let currentLobby = null;
    console.log('Player connected.');

    // Verarbeitung von Nachrichten
    ws.on('message', message => {
        const data = JSON.parse(message);

        switch (data.action) {
            case 'createLobby':
                const lobbyCode = generateLobbyCode();
                lobbies[lobbyCode] = { players: [ws], gameStarted: false };
                puzzles[lobbyCode] = { puzzle: [], size: 3, tilesize: 100, completed: false };
                ws.send(JSON.stringify({ action: 'lobbyCreated', code: lobbyCode }));
                currentLobby = lobbyCode;
                break;

            case 'joinLobby':
                if (lobbies[data.code] && lobbies[data.code].players.length < 2) {
                    lobbies[data.code].players.push(ws);
                    currentLobby = data.code;
                    ws.send(JSON.stringify({ action: 'lobbyJoined', code: data.code }));
                } else {
                    ws.send(JSON.stringify({ action: 'lobbyFull', message: 'Lobby ist voll oder existiert nicht.' }));
                }
                break;

            case 'startGame':
                if (lobbies[currentLobby] && lobbies[currentLobby].players.length === 2 && !lobbies[currentLobby].gameStarted) {
                    lobbies[currentLobby].gameStarted = true;

                    const puzzle = generatePuzzle(currentLobby);

                    // Puzzle an alle Spieler in der Lobby senden
                    lobbies[currentLobby].players.forEach(player => {
                        player.send(JSON.stringify({ action: 'gameStarted', puzzle }));
                    });
                }
                break;

            case 'move':
                if (lobbies[currentLobby] && lobbies[currentLobby].gameStarted) {
                    puzzles[currentLobby].puzzle = data.puzzle;
                    syncPuzzleToPlayers(currentLobby);
                    checkIfSolved(currentLobby);
                }
                break;
            case 'puzzleSolved':
                puzzles[currentLobby].completed = true;
                lobbies[currentLobby].players.forEach(player => {
                    player.send(JSON.stringify({ action: 'gameOver' }));
                });
                break;
        }
    });

    ws.on('close', () => {
        console.log('Player disconnected.');
        if (currentLobby && lobbies[currentLobby]) {
            lobbies[currentLobby].players = lobbies[currentLobby].players.filter(player => player !== ws);

            if (lobbies[currentLobby].players.length === 0) {
                delete lobbies[currentLobby];
                delete puzzles[currentLobby];
            } else {
                syncPuzzleToPlayers(currentLobby);
            }
        }
    });
});

function generatePuzzle(currentLobby) {
    if (!puzzles[currentLobby]) {
        throw new Error(`Puzzle data for lobby ${currentLobby} not found.`);
    }

    let size = puzzles[currentLobby].size;
    let tilesize = puzzles[currentLobby].tilesize;
    createPuzzle(size, tilesize, currentLobby);

    do {
        randomizePuzzle(size, currentLobby);
    } while (!isPuzzleValid(size, currentLobby) || !validateEmptyPuzzle(currentLobby));

    return puzzles[currentLobby].puzzle;
}


function createPuzzle(size, tilesize, currentLobby) {
    for (let i = 1; i <= size * size; i++) {
        puzzles[currentLobby].puzzle.push({
            value: i === size * size ? null : i,
            position: i,
            x: (getCol(i, size) - 1) * tilesize,
            y: (getRow(i, size) - 1) * tilesize,
            disabled: i === size * size,
        });
    }
}


function randomizePuzzle(size, currentLobby) {
    const puzzle = puzzles[currentLobby].puzzle;
    const randomValues = getRandomValues(size);

    let i = 0;
    for (let puzzleItem of puzzle) {
        puzzleItem.value = randomValues[i];
        puzzleItem.disabled = false;
        i++;
    }

    const emptyPuzzle = puzzle.find((item) => item.value === size * size);
    emptyPuzzle.disabled = true;
}


function isPuzzleValid(size, currentLobby) {
    let inversions = 0;
    const values = puzzles[currentLobby].puzzle.map((item) => item.value);

    for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
            if (values[i] > values[j] && values[i] !== size * size) inversions++;
        }
    }

    return size % 2 === 1 ? inversions % 2 === 0 : inversions % 2 === 1;
}


function validateEmptyPuzzle(currentLobby) {
    return puzzles[currentLobby].puzzle.filter((item) => item.disabled).length === 1;
}


function syncPuzzleToPlayers(lobbyCode) {
    const puzzle = puzzles[lobbyCode].puzzle;
    lobbies[lobbyCode].players.forEach(player => {
        player.send(JSON.stringify({ action: 'updatePuzzle', puzzle }));
    });
}


function getRandomValues(size) {
    const values = Array.from({ length: size * size }, (_, i) => i + 1);
    return values.sort(() => Math.random() - 0.5);
}

function getRow(pos, size) {
    return Math.ceil(pos / size);
}

function getCol(pos, size) {
    const col = pos % size;
    return col === 0 ? size : col;
}

server.listen(8080, () => console.log('Server running on ws://localhost:8080'));
