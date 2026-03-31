import { InputHandler } from './InputHandler.js';
import { Game } from './Game.js';

const canvas = document.getElementById('gameCanvas');
const input = new InputHandler();

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

const game = new Game(canvas, ui, input);

document.getElementById('startBtn').addEventListener('click', () => game.start());
document.getElementById('pauseBtn').addEventListener('click', () => {
  if (game.state === 'menu' || game.state === 'victory' || game.state === 'gameover') return;
  game.togglePause();
});
document.getElementById('restartBtn').addEventListener('click', () => game.restart());

function loop(timestamp) {
  game.update(timestamp);
  game.draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
