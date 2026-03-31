import { LEVELS } from './levels.js';
import { Platform } from './Platform.js';
import { Player } from './Player.js';
import { rectsIntersect, circleRectOverlap } from './Collision.js';
import { Renderer } from './Renderer.js';

export class Game {
  constructor(canvas, ui, input, controls = {}) {
    this.canvas = canvas;
    this.ui = ui;
    this.input = input;
    this.controls = controls;
    this.renderer = new Renderer(canvas);

    this.state = 'menu';
    this.levelIndex = 0;
    this.level = null;
    this.player = new Player({ x: 0, y: 0 });
    this.cameraX = 0;
    this.lives = 3;
    this.bestScore = Number(localStorage.getItem('lostSignalGroundsBest') || 0);
    this.totalCollected = 0;
    this.totalAvailable = 0;
    this.levelStats = [];
    this.lastTimestamp = 0;
    this.pauseLatch = false;
    this.time = 0;
    this.startedOnce = false;
    this.autoResumeTimer = 0;
    this.uiDirty = true;

    this.totalAvailable = LEVELS.reduce((sum, level) => sum + level.collectibles.length, 0);
    this.levelStats = LEVELS.map((level) => ({ name: level.name, collected: 0, total: level.collectibles.length }));

    this.setOverlay('Платформер', 'Нажми «Старт»', 'После первого запуска игра идёт без повторного нажатия. Портал открыт всегда, бонусы нужны только для статистики.');
    this.loadLevel(0);
    this.updateUI(true);
  }

  start() {
    if (this.state === 'victory' || this.state === 'gameover') {
      this.restart();
      return;
    }
    if (!this.startedOnce) {
      this.startedOnce = true;
      if (this.controls.startBtn) {
        this.controls.startBtn.disabled = true;
        this.controls.startBtn.textContent = 'Запущено';
      }
    }
    this.state = 'running';
    this.autoResumeTimer = 0;
    this.hideOverlay();
  }

  restart() {
    this.state = 'running';
    this.lives = 3;
    this.totalCollected = 0;
    this.levelStats = LEVELS.map((level) => ({ name: level.name, collected: 0, total: level.collectibles.length }));
    this.time = 0;
    this.autoResumeTimer = 0;
    this.loadLevel(0);
    this.hideOverlay();
    this.uiDirty = true;
    this.updateUI(true);
  }

  togglePause() {
    if (this.state === 'running') {
      this.state = 'paused';
      this.setOverlay('Пауза', 'Игра остановлена', 'Нажми «Пауза» ещё раз или клавишу P, чтобы продолжить.');
    } else if (this.state === 'paused') {
      this.state = 'running';
      this.hideOverlay();
    }
  }

  cloneLevel(rawLevel) {
    return {
      ...rawLevel,
      solids: rawLevel.solids.map((solid) => new Platform(solid.x, solid.y, solid.width, solid.height, solid.type)),
      hazards: rawLevel.hazards.map((hazard) => ({ ...hazard })),
      collectibles: rawLevel.collectibles.map((item) => ({ ...item })),
      decor: rawLevel.decor.map((item) => ({ ...item })),
      portal: { ...rawLevel.portal },
      portalPulse: 0,
    };
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = this.cloneLevel(LEVELS[index]);
    this.player.reset(this.level.spawn);
    this.cameraX = 0;
    this.uiDirty = true;
    this.updateUI();
  }

  update(timestamp = 0) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    let dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    if (dt > 0.03) dt = 0.03;

    this.time += dt;

    const pausePressed = this.input.isPausePressed();
    if (pausePressed && !this.pauseLatch && this.state !== 'menu' && this.state !== 'victory' && this.state !== 'gameover') {
      this.togglePause();
    }
    this.pauseLatch = pausePressed;

    if (this.autoResumeTimer > 0) {
      this.autoResumeTimer -= dt;
      if (this.autoResumeTimer <= 0 && this.state === 'paused') {
        this.state = 'running';
        this.hideOverlay();
      }
    }

    if (this.state !== 'running') return;

    this.level.portalPulse += dt * 4;
    this.updateHazards(dt);
    this.player.update(this.input, dt);
    this.moveAndCollide(dt);
    this.collectBonuses();
    this.checkHazards();
    this.checkPortal();
    this.updateCamera(dt);
    this.updateUI();
  }

  updateHazards(dt) {
    for (const hazard of this.level.hazards) {
      if (hazard.type !== 'flyer') continue;
      hazard.x += hazard.speed * hazard.dir * dt;
      if (hazard.x <= hazard.minX) {
        hazard.x = hazard.minX;
        hazard.dir = 1;
      } else if (hazard.x >= hazard.maxX) {
        hazard.x = hazard.maxX;
        hazard.dir = -1;
      }
    }
  }

  getNearbySolids(margin = 90) {
    const left = this.player.x - margin;
    const right = this.player.x + this.player.width + margin;
    return this.level.solids.filter((solid) => solid.x + solid.width >= left && solid.x <= right);
  }

  moveAndCollide(dt) {
    const player = this.player;
    const solids = this.getNearbySolids();
    player.onGround = false;

    player.x += player.vx * dt;
    for (const solid of solids) {
      if (!rectsIntersect(player.bounds, solid)) continue;
      if (player.vx > 0) player.x = solid.x - player.width;
      else if (player.vx < 0) player.x = solid.x + solid.width;
      player.vx = 0;
    }

    player.y += player.vy * dt;
    for (const solid of solids) {
      if (!rectsIntersect(player.bounds, solid)) continue;
      if (player.vy > 0) {
        player.y = solid.y - player.height;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = solid.y + solid.height;
        player.vy = Math.abs(player.vy) * player.bounce;
      }
    }

    if (player.y > this.canvas.height + 150) {
      this.loseLife('Провал в дыру');
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > this.level.worldWidth) {
      player.x = this.level.worldWidth - player.width;
      player.vx = 0;
    }
  }

  collectBonuses() {
    const circle = { x: this.player.centerX, y: this.player.centerY, radius: this.player.radius };
    for (const item of this.level.collectibles) {
      if (item.collected) continue;
      const rect = { x: item.x - 10, y: item.y - 10, width: 20, height: 20 };
      if (!circleRectOverlap(circle, rect)) continue;
      item.collected = true;
      this.totalCollected += 1;
      this.levelStats[this.levelIndex].collected += 1;
      this.uiDirty = true;
    }
  }

  checkHazards() {
    const circle = { x: this.player.centerX, y: this.player.centerY, radius: this.player.radius };
    for (const hazard of this.level.hazards) {
      const rect = { x: hazard.x, y: hazard.y, width: hazard.width, height: hazard.height };
      if (circleRectOverlap(circle, rect)) {
        this.loseLife(hazard.type === 'flyer' ? 'Летун' : 'Шипы');
        return;
      }
    }
  }

  checkPortal() {
    const circle = { x: this.player.centerX, y: this.player.centerY, radius: this.player.radius };
    if (!circleRectOverlap(circle, this.level.portal)) return;

    if (this.levelIndex < LEVELS.length - 1) {
      const nextLevel = this.levelIndex + 1;
      const title = LEVELS[nextLevel].name;
      const story = LEVELS[nextLevel].story;
      this.loadLevel(nextLevel);
      this.state = 'paused';
      this.autoResumeTimer = 1.1;
      this.setOverlay('Переход', title, story);
    } else {
      this.finishGame();
    }
  }

  loseLife(reason) {
    if (this.state !== 'running') return;
    this.lives -= 1;
    this.uiDirty = true;
    if (this.lives <= 0) {
      this.state = 'gameover';
      this.showFinalStats('Сигнал потерян', `Попытки закончились. Последняя ошибка: ${reason}.`);
      return;
    }

    this.player.reset(this.level.spawn);
    this.cameraX = 0;
    this.state = 'paused';
    this.autoResumeTimer = 0.9;
    this.setOverlay('Попытка сорвалась', `Минус жизнь: ${reason}`, 'Сейчас игра сама продолжится, повторно жать «Старт» не нужно.');
  }

  finishGame() {
    this.state = 'victory';
    this.autoResumeTimer = 0;
    if (this.totalCollected > this.bestScore) {
      this.bestScore = this.totalCollected;
      localStorage.setItem('lostSignalGroundsBest', String(this.bestScore));
    }
    this.showFinalStats('Сигнал восстановлен', 'Игра завершена. Ниже — бонусы по каждому уровню и общий итог.');
    this.uiDirty = true;
    this.updateUI(true);
  }

  showFinalStats(title, text) {
    this.ui.overlayStats.innerHTML = this.levelStats
      .map((row) => `<div class="stats-row"><span>${row.name}</span><strong>${row.collected} / ${row.total}</strong></div>`)
      .join('') + `<div class="stats-row"><span>Общий итог</span><strong>${this.totalCollected} / ${this.totalAvailable}</strong></div>`;
    this.setOverlay('Финальная статистика', title, text, false);
  }

  updateCamera(dt) {
    const targetX = this.player.centerX - this.canvas.width * 0.34;
    const maxCameraX = Math.max(0, this.level.worldWidth - this.canvas.width);
    this.cameraX += (targetX - this.cameraX) * Math.min(1, dt * 7.5);
    if (this.cameraX < 0) this.cameraX = 0;
    if (this.cameraX > maxCameraX) this.cameraX = maxCameraX;
  }

  updateUI(force = false) {
    if (!this.uiDirty && !force) return;
    this.ui.levelValue.textContent = `${this.levelIndex + 1} / ${LEVELS.length}`;
    this.ui.scoreValue.textContent = `${this.levelStats[this.levelIndex]?.collected ?? 0} / ${this.levelStats[this.levelIndex]?.total ?? 0}`;
    this.ui.livesValue.textContent = String(this.lives);
    this.ui.bestValue.textContent = String(this.bestScore);
    this.uiDirty = false;
  }

  setOverlay(tag, title, text, clearStats = true) {
    this.ui.overlayTag.textContent = tag;
    this.ui.overlayTitle.textContent = title;
    this.ui.overlayText.textContent = text;
    if (clearStats) this.ui.overlayStats.innerHTML = '';
    this.ui.overlay.classList.remove('hidden');
  }

  hideOverlay() {
    this.ui.overlay.classList.add('hidden');
  }

  draw() {
    this.renderer.draw(this);
  }
}
