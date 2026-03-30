import { Game } from './Game.js';

const canvas = document.getElementById('gameCanvas');

const hud = {
  scoreValue: document.getElementById('scoreValue'),
  livesValue: document.getElementById('livesValue'),
  levelValue: document.getElementById('levelValue'),
  bestValue: document.getElementById('bestValue'),
  statusText: document.getElementById('statusText'),
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  restartBtn: document.getElementById('restartBtn'),
};

const game = new Game(canvas, hud);
game.run();
