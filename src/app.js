import { EMPTY, TetrisGame, PIECES } from "./tetris.js";

const canvas = document.querySelector("#board");
const nextCanvas = document.querySelector("#next");
const scoreEl = document.querySelector("#score");
const highScoreEl = document.querySelector("#high-score");
const placedBlocksEl = document.querySelector("#placed-blocks");
const speedEl = document.querySelector("#speed");
const restartButton = document.querySelector("#restart");

const context = canvas.getContext("2d");
const nextContext = nextCanvas.getContext("2d");
const cellSize = canvas.width / 10;
const nextCellSize = 24;
const game = new TetrisGame({ storage: window.localStorage });

let lastTime = 0;
let dropCounter = 0;
let paused = false;

function drawCell(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * size, y * size, size, size);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
}

function drawBoard() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#10151f";
  context.fillRect(0, 0, canvas.width, canvas.height);

  game.board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== EMPTY) {
        drawCell(context, x, y, cellSize, PIECES[cell].color);
      }
    });
  });

  const piece = game.activePiece;
  if (!piece || game.gameOver) {
    return;
  }

  piece.matrix.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        drawCell(context, piece.x + x, piece.y + y, cellSize, piece.color);
      }
    });
  });
}

function drawNextPiece() {
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextContext.fillStyle = "#10151f";
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  const piece = game.nextPiece;
  const offsetX = Math.floor((5 - piece.matrix[0].length) / 2);
  const offsetY = Math.floor((5 - piece.matrix.length) / 2);

  piece.matrix.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        drawCell(nextContext, offsetX + x, offsetY + y, nextCellSize, piece.color);
      }
    });
  });
}

function updateHud() {
  scoreEl.textContent = game.score;
  highScoreEl.textContent = game.highScore;
  placedBlocksEl.textContent = game.placedBlocks;
  speedEl.textContent = game.speedLevel;
}

function drawOverlay(text) {
  context.fillStyle = "rgba(7, 10, 16, 0.72)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f8fafc";
  context.font = "700 30px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(text, canvas.width / 2, canvas.height / 2);
}

function render() {
  drawBoard();
  drawNextPiece();
  updateHud();

  if (game.gameOver) {
    drawOverlay("Game Over");
  } else if (paused) {
    drawOverlay("Paused");
  }
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (!paused && !game.gameOver) {
    dropCounter += delta;
    if (dropCounter > game.fallInterval) {
      game.softDrop();
      dropCounter = 0;
    }
  }

  render();
  requestAnimationFrame(update);
}

function restart() {
  game.reset();
  dropCounter = 0;
  paused = false;
  render();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "p" || event.key === "P") {
    paused = !paused;
    return;
  }

  if (paused || game.gameOver) {
    if (event.key === "Enter") {
      restart();
    }
    return;
  }

  if (event.key === "ArrowLeft") {
    game.move(-1);
  } else if (event.key === "ArrowRight") {
    game.move(1);
  } else if (event.key === "ArrowDown") {
    game.softDrop();
    dropCounter = 0;
  } else if (event.key === "ArrowUp") {
    game.rotate();
  } else if (event.code === "Space") {
    event.preventDefault();
    game.hardDrop();
    dropCounter = 0;
  }
});

restartButton.addEventListener("click", restart);
requestAnimationFrame(update);
