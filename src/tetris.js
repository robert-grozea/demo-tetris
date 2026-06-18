export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const EMPTY = 0;
export const HIGH_SCORE_KEY = "demo-tetris-high-score";

export const PIECES = {
  I: {
    color: "#28c7fa",
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  },
  J: {
    color: "#3d6df2",
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  L: {
    color: "#f59f22",
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  O: {
    color: "#f7d038",
    matrix: [
      [1, 1],
      [1, 1]
    ]
  },
  S: {
    color: "#5acf65",
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ]
  },
  T: {
    color: "#a970ff",
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  Z: {
    color: "#f25f5c",
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ]
  }
};

const PIECE_NAMES = Object.keys(PIECES);
const LINE_SCORES = [0, 100, 300, 500, 800];

export function createBoard(width = BOARD_WIDTH, height = BOARD_HEIGHT) {
  return Array.from({ length: height }, () => Array(width).fill(EMPTY));
}

export function cloneMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

export function rotateMatrix(matrix) {
  const size = matrix.length;
  const rotated = createBoard(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      rotated[x][size - 1 - y] = matrix[y][x];
    }
  }

  return rotated;
}

export function makePiece(name) {
  const shape = PIECES[name];
  if (!shape) {
    throw new Error(`Unknown piece: ${name}`);
  }

  return {
    name,
    color: shape.color,
    matrix: cloneMatrix(shape.matrix),
    x: Math.floor((BOARD_WIDTH - shape.matrix[0].length) / 2),
    y: 0
  };
}

export function getStoredHighScore(storage, key = HIGH_SCORE_KEY) {
  if (!storage) {
    return 0;
  }

  const value = Number(storage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function saveStoredHighScore(storage, score, key = HIGH_SCORE_KEY) {
  if (storage) {
    storage.setItem(key, String(score));
  }
}

export class TetrisGame {
  constructor({
    width = BOARD_WIDTH,
    height = BOARD_HEIGHT,
    storage = null,
    random = Math.random,
    pieces = null
  } = {}) {
    this.width = width;
    this.height = height;
    this.storage = storage;
    this.random = random;
    this.pieceQueue = pieces ? [...pieces] : [];
    this.baseFallInterval = 900;
    this.minimumFallInterval = 120;
    this.speedStep = 70;
    this.reset();
  }

  reset() {
    this.board = createBoard(this.width, this.height);
    this.score = 0;
    this.lines = 0;
    this.placedBlocks = 0;
    this.speedLevel = 1;
    this.fallInterval = this.baseFallInterval;
    this.gameOver = false;
    this.highScore = getStoredHighScore(this.storage);
    this.activePiece = this.createNextPiece();
    this.nextPiece = this.createNextPiece();
    return this.snapshot();
  }

  createNextPiece() {
    const name = this.pieceQueue.length
      ? this.pieceQueue.shift()
      : PIECE_NAMES[Math.floor(this.random() * PIECE_NAMES.length)];
    return makePiece(name);
  }

  snapshot() {
    return {
      board: this.board.map((row) => [...row]),
      activePiece: this.activePiece ? { ...this.activePiece, matrix: cloneMatrix(this.activePiece.matrix) } : null,
      nextPiece: this.nextPiece ? { ...this.nextPiece, matrix: cloneMatrix(this.nextPiece.matrix) } : null,
      score: this.score,
      highScore: this.highScore,
      lines: this.lines,
      placedBlocks: this.placedBlocks,
      speedLevel: this.speedLevel,
      fallInterval: this.fallInterval,
      gameOver: this.gameOver
    };
  }

  collides(piece = this.activePiece, offsetX = 0, offsetY = 0, matrix = piece.matrix) {
    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) {
          continue;
        }

        const boardX = piece.x + x + offsetX;
        const boardY = piece.y + y + offsetY;

        if (boardX < 0 || boardX >= this.width || boardY >= this.height) {
          return true;
        }

        if (boardY >= 0 && this.board[boardY][boardX] !== EMPTY) {
          return true;
        }
      }
    }

    return false;
  }

  move(dx) {
    if (this.gameOver || this.collides(this.activePiece, dx, 0)) {
      return false;
    }

    this.activePiece.x += dx;
    return true;
  }

  rotate() {
    if (this.gameOver) {
      return false;
    }

    const rotated = rotateMatrix(this.activePiece.matrix);
    const kicks = [0, -1, 1, -2, 2];

    for (const kick of kicks) {
      if (!this.collides(this.activePiece, kick, 0, rotated)) {
        this.activePiece.x += kick;
        this.activePiece.matrix = rotated;
        return true;
      }
    }

    return false;
  }

  softDrop() {
    if (this.gameOver) {
      return false;
    }

    if (!this.collides(this.activePiece, 0, 1)) {
      this.activePiece.y += 1;
      return true;
    }

    this.lockPiece();
    return false;
  }

  hardDrop() {
    if (this.gameOver) {
      return false;
    }

    while (!this.collides(this.activePiece, 0, 1)) {
      this.activePiece.y += 1;
    }

    this.lockPiece();
    return true;
  }

  lockPiece() {
    for (let y = 0; y < this.activePiece.matrix.length; y += 1) {
      for (let x = 0; x < this.activePiece.matrix[y].length; x += 1) {
        if (!this.activePiece.matrix[y][x]) {
          continue;
        }

        const boardX = this.activePiece.x + x;
        const boardY = this.activePiece.y + y;
        if (boardY >= 0) {
          this.board[boardY][boardX] = this.activePiece.name;
        }
      }
    }

    this.placedBlocks += 1;
    this.updateSpeed();
    const cleared = this.clearLines();
    this.addScore(cleared);
    this.spawnPiece();
  }

  updateSpeed() {
    this.speedLevel = Math.floor(this.placedBlocks / 10) + 1;
    this.fallInterval = Math.max(
      this.minimumFallInterval,
      this.baseFallInterval - (this.speedLevel - 1) * this.speedStep
    );
  }

  clearLines() {
    const remainingRows = this.board.filter((row) => row.some((cell) => cell === EMPTY));
    const cleared = this.height - remainingRows.length;

    while (remainingRows.length < this.height) {
      remainingRows.unshift(Array(this.width).fill(EMPTY));
    }

    this.board = remainingRows;
    this.lines += cleared;
    return cleared;
  }

  addScore(clearedLines) {
    const placementPoints = 10;
    this.score += placementPoints + LINE_SCORES[clearedLines] * this.speedLevel;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveStoredHighScore(this.storage, this.highScore);
    }
  }

  spawnPiece() {
    this.activePiece = this.nextPiece;
    this.nextPiece = this.createNextPiece();

    if (this.collides(this.activePiece, 0, 0)) {
      this.gameOver = true;
    }
  }
}
