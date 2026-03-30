import { InputHandler } from './InputHandler.js';
import { Player } from './Player.js';
import { Platform } from './Platform.js';
import { Collectible } from './Collectible.js';
import { Renderer } from './Renderer.js';
import { isRectColliding, isCircleRectColliding } from './Collision.js';
import { levels } from './levels.js';

export class Game {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.renderer = new Renderer(this.ctx, canvas.width, canvas.height);
    this.input = new InputHandler();
    this.hud = hud;
    this.bestStorageKey = 'soft-hop-best-score';
    this.bestScore = Number(localStorage.getItem(this.bestStorageKey) || 0);

    this.state = 'idle';
    this.currentLevelIndex = 0;
    this.score = 0;
    this.lives = 3;
    this.cameraX = 0;
    this.lastTime = 0;
    this.platforms = [];
    this.collectibles = [];
    this.goal = null;
    this.goalUnlocked = false;

    this.player = new Player(70, 390);
    this.bindUi();
    this.updateHud('Нажми «Старт», собери все монеты и дойди до флага.');
  }

  bindUi() {
    this.hud.startBtn.addEventListener('click', () => this.start());
    this.hud.pauseBtn.addEventListener('click', () => this.togglePause());
    this.hud.restartBtn.addEventListener('click', () => this.restart());

    window.addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() === 'p') this.togglePause();
      if (event.key.toLowerCase() === 'r') this.restart();
      if (event.key.toLowerCase() === 'enter' && (this.state === 'idle' || this.state === 'won' || this.state === 'gameover')) {
        this.start();
      }
    });
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.currentLevelIndex = 0;
    this.state = 'running';
    this.loadLevel(this.currentLevelIndex, true);
    this.updateHud(`Уровень 1: ${levels[0].name}. Собери все монеты и коснись флага.`);
  }

  restart() {
    this.state = 'running';
    this.score = 0;
    this.lives = 3;
    this.currentLevelIndex = 0;
    this.loadLevel(this.currentLevelIndex, true);
    this.updateHud('Игра перезапущена. Всё чисто и без лишней суеты.');
  }

  togglePause() {
    if (this.state === 'running') {
      this.state = 'paused';
      this.updateHud('Пауза. Нажми P или кнопку ещё раз, чтобы продолжить.');
    } else if (this.state === 'paused') {
      this.state = 'running';
      this.updateHud(`Уровень ${this.currentLevelIndex + 1}: ${levels[this.currentLevelIndex].name}`);
    }
  }

  loadLevel(levelIndex, resetCamera = false) {
    const level = levels[levelIndex];
    this.level = level;
    this.platforms = level.platforms.map((item) => new Platform(item.x, item.y, item.width, item.height, item.type));
    this.collectibles = level.collectibles.map((item) => new Collectible(item.x, item.y));
    this.goal = this.platforms.find((platform) => platform.type === 'goal');
    this.goalUnlocked = false;
    this.player.startX = level.playerStart.x;
    this.player.startY = level.playerStart.y;
    this.player.reset();
    if (resetCamera) this.cameraX = 0;
    this.syncHud();
  }

  get remainingCollectibles() {
    return this.collectibles.filter((item) => !item.collected).length;
  }

  loseLife(reasonText) {
    this.lives -= 1;
    if (this.lives <= 0) {
      this.lives = 0;
      this.state = 'gameover';
      this.persistBestScore();
      this.updateHud(reasonText || 'Игра окончена.');
      this.syncHud();
      return;
    }

    this.player.reset();
    this.cameraX = Math.max(0, this.player.x - 140);
    this.updateHud(`${reasonText || 'Промах.'} Осталось жизней: ${this.lives}.`);
    this.syncHud();
  }

  completeLevel() {
    this.score += 100;
    if (this.currentLevelIndex >= levels.length - 1) {
      this.state = 'won';
      this.persistBestScore();
      this.updateHud(`Ты прошёл обе карты. Финальный счёт: ${this.score}.`);
      this.syncHud();
      return;
    }

    this.currentLevelIndex += 1;
    this.loadLevel(this.currentLevelIndex, true);
    this.updateHud(`Уровень ${this.currentLevelIndex + 1}: ${levels[this.currentLevelIndex].name}.`);
  }

  persistBestScore() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem(this.bestStorageKey, String(this.bestScore));
    }
  }

  updateHud(statusText) {
    this.hud.statusText.textContent = statusText;
    this.syncHud();
  }

  syncHud() {
    this.goalUnlocked = this.remainingCollectibles === 0;
    this.hud.scoreValue.textContent = String(this.score);
    this.hud.livesValue.textContent = String(this.lives);
    this.hud.levelValue.textContent = `${this.currentLevelIndex + 1}/${levels.length}`;
    this.hud.bestValue.textContent = String(Math.max(this.bestScore, this.score));
  }

  update(deltaTime) {
    if (this.state !== 'running') return;

    this.player.handleInput(this.input, deltaTime);
    this.player.leaveGround();
    this.player.update(deltaTime);

    for (const platform of this.platforms) {
      if (platform.type !== 'solid') continue;
      if (!isRectColliding(this.player.bounds, platform)) continue;

      const previousBottom = this.player.y + this.player.height - this.player.vy * (deltaTime / 1000);
      const previousTop = this.player.y - this.player.vy * (deltaTime / 1000);
      const previousRight = this.player.x + this.player.width - this.player.vx * (deltaTime / 1000);
      const previousLeft = this.player.x - this.player.vx * (deltaTime / 1000);

      if (previousBottom <= platform.y + 8 && this.player.vy >= 0) {
        this.player.landOn(platform.y);
      } else if (previousTop >= platform.y + platform.height - 8 && this.player.vy < 0) {
        this.player.y = platform.y + platform.height;
        this.player.vy = 0;
      } else if (previousRight <= platform.x + 8 && this.player.vx > 0) {
        this.player.x = platform.x - this.player.width;
        this.player.vx = 0;
      } else if (previousLeft >= platform.x + platform.width - 8 && this.player.vx < 0) {
        this.player.x = platform.x + platform.width;
        this.player.vx = 0;
      }
    }

    for (const platform of this.platforms) {
      if (platform.type === 'hazard' && isRectColliding(this.player.bounds, platform)) {
        this.loseLife('Осторожно, шипы.');
        return;
      }
    }

    for (const collectible of this.collectibles) {
      if (collectible.collected) continue;
      if (isCircleRectColliding(collectible, this.player.bounds)) {
        collectible.collected = true;
        this.score += collectible.value;
        this.persistBestScore();
        const left = this.remainingCollectibles;
        this.updateHud(left === 0 ? 'Все монеты собраны. Флаг активен.' : `Монета собрана. Осталось: ${left}.`);
      }
    }

    if (this.goal && this.goalUnlocked && isRectColliding(this.player.bounds, this.goal)) {
      this.completeLevel();
      return;
    }

    if (this.player.y > this.canvas.height + 160) {
      this.loseLife('Падение вниз — это был лишний трюк.');
      return;
    }

    const targetCameraX = this.player.x - this.canvas.width * 0.35;
    const maxCamera = Math.max(0, this.level.width - this.canvas.width);
    this.cameraX += (Math.max(0, Math.min(maxCamera, targetCameraX)) - this.cameraX) * 0.08;
    if (Math.abs(this.cameraX) < 0.01) this.cameraX = 0;
  }

  render(time) {
    this.renderer.clear();
    this.renderer.drawBackground(this.cameraX);

    if (this.level) {
      for (const platform of this.platforms) platform.draw(this.ctx, this.cameraX, this.goalUnlocked);
      for (const collectible of this.collectibles) collectible.draw(this.ctx, this.cameraX, time);
      this.player.draw(this.ctx, this.cameraX);
      this.drawLevelName();
    }

    if (this.state === 'idle') {
      this.renderer.drawOverlay('Soft Hop', 'Спокойный платформер: собери все монеты и дойди до флага.');
    }

    if (this.state === 'paused') {
      this.renderer.drawOverlay('Пауза', 'Можно передохнуть. Мяч никуда не укатится.');
    }

    if (this.state === 'gameover') {
      this.renderer.drawOverlay('Game Over', `Счёт: ${this.score}. Попробуй ещё раз.`);
    }

    if (this.state === 'won') {
      this.renderer.drawOverlay('Победа', `Финальный счёт: ${this.score}. Ты всё прошёл.`);
    }
  }

  drawLevelName() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(246, 242, 232, 0.92)';
    this.ctx.beginPath();
    this.ctx.roundRect(18, 18, 260, 52, 14);
    this.ctx.fill();
    this.ctx.fillStyle = '#44564d';
    this.ctx.font = '700 20px Inter, sans-serif';
    this.ctx.fillText(`Уровень ${this.currentLevelIndex + 1}/${levels.length}`, 34, 48);
    this.ctx.fillStyle = '#6f7e75';
    this.ctx.font = '400 13px Inter, sans-serif';
    this.ctx.fillText(this.goalUnlocked ? 'Флаг активен' : `Монет осталось: ${this.remainingCollectibles}`, 34, 64);
    this.ctx.restore();
  }

  loop = (timestamp) => {
    if (!this.lastTime) this.lastTime = timestamp;
    const deltaTime = Math.min(32, timestamp - this.lastTime);
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.render(timestamp);

    requestAnimationFrame(this.loop);
  };

  run() {
    this.loadLevel(0, true);
    requestAnimationFrame(this.loop);
  }
}
