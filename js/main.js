import { InputHandler } from './InputHandler.js';
import { Game } from './Game.js';

const canvas = document.getElementById('gameCanvas');
const input = new InputHandler();
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');

const ui = {
  levelValue: document.getElementById('levelValue'),
  scoreValue: document.getElementById('scoreValue'),
  livesValue: document.getElementById('livesValue'),
  bestValue: document.getElementById('bestValue'),
  overlay: document.getElementById('overlay'),
  overlayTag: document.getElementById('overlayTag'),
  overlayTitle: document.getElementById('overlayTitle'),
  overlayText: document.getElementById('overlayText'),
  overlayStats: document.getElementById('overlayStats'),
};

const game = new Game(canvas, ui, input, { startBtn, pauseBtn, restartBtn });

startBtn.addEventListener('click', () => game.start());
pauseBtn.addEventListener('click', () => {
  if (game.state === 'menu' || game.state === 'victory' || game.state === 'gameover') return;
  game.togglePause();
});
restartBtn.addEventListener('click', () => game.restart());

function loop(timestamp) {
  game.update(timestamp);
  game.draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
