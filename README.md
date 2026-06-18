# Demo Tetris

A complete browser-based Tetris game built with plain JavaScript, HTML, and CSS.

## Features

- Canvas-rendered Tetris board and next-piece preview
- Current score, placed block count, speed level, and high score display
- High score persistence through `localStorage`
- Falling speed increases after every 10 placed blocks
- Game logic separated from rendering for unit testing
- Unit tests for scoring, collision, line clearing, placement, speed changes, and high-score persistence

## Controls

- Left / Right arrows: move piece
- Down arrow: soft drop
- Up arrow: rotate
- Space: hard drop
- P: pause
- Enter: restart after game over

## Setup

```bash
npm install
```

This project has no external runtime dependencies. The test suite uses Node's built-in test runner.

## Run

```bash
npm start
```

Then open `http://localhost:8080`.

You can also serve the folder with any static web server.

## Test

```bash
npm test
```
