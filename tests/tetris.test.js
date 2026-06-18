import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY,
  HIGH_SCORE_KEY,
  TetrisGame,
  createBoard,
  getStoredHighScore,
  saveStoredHighScore
} from "../src/tetris.js";

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    }
  };
}

test("detects wall and board collisions", () => {
  const game = new TetrisGame({ pieces: ["O", "I", "T"] });

  game.activePiece.x = -1;
  assert.equal(game.collides(), true);

  game.activePiece.x = 4;
  game.activePiece.y = 18;
  assert.equal(game.collides(), false);

  game.activePiece.y = 19;
  assert.equal(game.collides(), true);

  game.activePiece.y = 17;
  game.board[18][4] = "Z";
  assert.equal(game.collides(), true);
});

test("locks a placed block into the board", () => {
  const game = new TetrisGame({ pieces: ["O", "I", "T"] });

  game.hardDrop();

  assert.equal(game.placedBlocks, 1);
  assert.equal(game.board[18][4], "O");
  assert.equal(game.board[18][5], "O");
  assert.equal(game.board[19][4], "O");
  assert.equal(game.board[19][5], "O");
});

test("clears completed lines and awards line score", () => {
  const game = new TetrisGame({ pieces: ["O", "I", "T"] });
  game.board = createBoard();
  game.board[19] = Array(10).fill("Z");
  game.board[19][4] = EMPTY;
  game.board[19][5] = EMPTY;
  game.activePiece = {
    name: "O",
    color: "#f7d038",
    matrix: [[1, 1]],
    x: 4,
    y: 19
  };

  game.lockPiece();

  assert.equal(game.lines, 1);
  assert.equal(game.score, 110);
  assert.deepEqual(game.board[19], Array(10).fill(EMPTY));
});

test("increases falling speed after every 10 placed blocks", () => {
  const game = new TetrisGame({ pieces: ["O", "I", "T"] });
  const initialInterval = game.fallInterval;

  game.placedBlocks = 9;
  game.updateSpeed();
  assert.equal(game.speedLevel, 1);
  assert.equal(game.fallInterval, initialInterval);

  game.placedBlocks = 10;
  game.updateSpeed();
  assert.equal(game.speedLevel, 2);
  assert.equal(game.fallInterval, initialInterval - game.speedStep);

  game.placedBlocks = 20;
  game.updateSpeed();
  assert.equal(game.speedLevel, 3);
});

test("persists and loads high score through localStorage-compatible storage", () => {
  const storage = memoryStorage({ [HIGH_SCORE_KEY]: "250" });
  const game = new TetrisGame({ storage, pieces: ["O", "I", "T"] });

  assert.equal(getStoredHighScore(storage), 250);
  assert.equal(game.highScore, 250);

  game.addScore(4);
  assert.equal(game.highScore, 810);
  assert.equal(storage.getItem(HIGH_SCORE_KEY), "810");

  saveStoredHighScore(storage, 900);
  assert.equal(getStoredHighScore(storage), 900);
});
