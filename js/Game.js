import { LEVELS } from './levels.js';
import { Platform } from './Platform.js';
import { Player } from './Player.js';
import { rectsIntersect, circleRectOverlap } from './Collision.js';
import { Renderer } from './Renderer.js';

export class Game {
  constructor(canvas, ui, input) {
    this.canvas = canvas;
    this.ui = ui;
    this.input = input;
    this.renderer = new Renderer(canvas);

    this.state = 'menu';
    this.levelIndex = 0;
    this.level = null;
    this.player = new Player({ x: 0, y: 0 });
    this.cameraX = 0;
    this.lives = 3;
    this.bestScore = Number(localStorage.getItem('lostSignalRebootBest') || 0);
    this.totalCollected = 0;
    this.totalAvailable = 0;
    this.levelStats = [];
    this.lastTimestamp = 0;
    this.pauseLatch = false;

    this.setOverlay('Таймкиллер-платформер', 'Нажми «Старт»', 'Проход к порталу открыт сразу. Бонусы собираются для итоговой статистики, а не для разблокировки двери.');
    this.loadLevel(0, true);
    this.updateUI();
  }

  start() {
    if (this.state === 'victory' || this.state === 'gameover') {
      this.restart();
      return;
    }
    this.state = 'running';
    this.hideOverlay();
  }

  restart() {
    this.state = 'running';
    this.lives = 3;
    this.totalCollected = 0;
    this.levelStats = LEVELS.map((level) => ({
      name: level.name,
      collected: 0,
      total: level.collectibles.length,
    }));
    this.loadLevel(0, true);
    this.hideOverlay();
    this.updateUI();
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

  loadLevel(index, resetRun = false) {
    this.levelIndex = index;
    this.level = this.cloneLevel(LEVELS[index]);
    this.player.reset(this.level.spawn);
    this.cameraX = 0;
    if (resetRun) {
      this.totalAvailable = LEVELS.reduce((sum, level) => sum + level.collectibles.length, 0);
      this.levelStats = LEVELS.map((level) => ({
        name: level.name,
        collected: 0,
        total: level.collectibles.length,
      }));
    }
    this.updateUI();
  }

  update(timestamp = 0) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    let dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    if (dt > 0.032) dt = 0.032;

    const pausePressed = this.input.isPausePressed();
    if (pausePressed && !this.pauseLatch && this.state !== 'menu' && this.state !== 'victory' && this.state !== 'gameover') {
      this.togglePause();
    }
    this.pauseLatch = pausePressed;

    if (this.state !== 'running') return;

    this.level.portalPulse += dt * 2;
    for (const item of this.level.collectibles) {
      item.floatOffset += dt * 3;
    }

    this.updateHazards(dt);
    this.player.update(this.input, dt);
    this.moveAndCollide(dt);
    this.collectBonuses();
    this.checkHazards();
    this.checkPortal();
    this.updateCamera();
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

  moveAndCollide(dt) {
    const player = this.player;
    player.onGround = false;

    player.x += player.vx * dt;
    for (const solid of this.level.solids) {
      if (!rectsIntersect(player.bounds, solid)) continue;
      if (player.vx > 0) {
        player.x = solid.x - player.width;
      } else if (player.vx < 0) {
        player.x = solid.x + solid.width;
      }
      player.vx = 0;
    }

    player.y += player.vy * dt;
    for (const solid of this.level.solids) {
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

    if (player.y > this.canvas.height + 140) {
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
    }
  }

  checkHazards() {
    const circle = { x: this.player.centerX, y: this.player.centerY, radius: this.player.radius };
    for (const hazard of this.level.hazards) {
      if (hazard.type === 'spikes') {
        const rect = { x: hazard.x, y: hazard.y, width: hazard.width, height: hazard.height };
        if (circleRectOverlap(circle, rect)) {
          this.loseLife('Шипы');
          return;
        }
      } else if (hazard.type === 'flyer') {
        const rect = { x: hazard.x, y: hazard.y, width: hazard.width, height: hazard.height };
        if (circleRectOverlap(circle, rect)) {
          this.loseLife('Летун');
          return;
        }
      }
    }
  }

  checkPortal() {
    const circle = { x: this.player.centerX, y: this.player.centerY, radius: this.player.radius };
    const portal = this.level.portal;
    if (!circleRectOverlap(circle, portal)) return;

    if (this.levelIndex < LEVELS.length - 1) {
      this.loadLevel(this.levelIndex + 1);
      this.setOverlay('Переход', this.level.name, this.level.story);
      this.state = 'paused';
    } else {
      this.finishGame();
    }
  }

  loseLife(reason) {
    if (this.state !== 'running') return;
    this.lives -= 1;
    if (this.lives <= 0) {
      this.state = 'gameover';
      this.showFinalStats('Сигнал потерян', `Попытки закончились. Причина последней ошибки: ${reason}.`);
      return;
    }

    this.player.reset(this.level.spawn);
    this.cameraX = 0;
    this.setOverlay('Попытка сорвалась', `Минус жизнь: ${reason}`, 'Но проход к порталу всё ещё открыт. Собирай бонусы по желанию и иди дальше.');
    this.state = 'paused';
    this.updateUI();
  }

  finishGame() {
    this.state = 'victory';
    if (this.totalCollected > this.bestScore) {
      this.bestScore = this.totalCollected;
      localStorage.setItem('lostSignalRebootBest', String(this.bestScore));
    }
    this.showFinalStats('Сигнал восстановлен', 'Игра завершена. Ниже — статистика по каждому уровню и общий итог.');
    this.updateUI();
  }

  showFinalStats(title, text) {
    this.ui.overlayStats.innerHTML = this.levelStats
      .map((row) => `<div class="stats-row"><span>${row.name}</span><strong>${row.collected} / ${row.total}</strong></div>`)
      .join('') + `<div class="stats-row"><span>Общий итог</span><strong>${this.totalCollected} / ${this.totalAvailable}</strong></div>`;
    this.setOverlay('Финальная статистика', title, text, false);
  }

  updateCamera() {
    const targetX = this.player.centerX - this.canvas.width * 0.35;
    this.cameraX += (targetX - this.cameraX) * 0.1;
    const maxCameraX = Math.max(0, this.level.worldWidth - this.canvas.width);
    if (this.cameraX < 0) this.cameraX = 0;
    if (this.cameraX > maxCameraX) this.cameraX = maxCameraX;
  }

  updateUI() {
    this.ui.levelValue.textContent = `${this.levelIndex + 1} / ${LEVELS.length}`;
    this.ui.scoreValue.textContent = `${this.levelStats[this.levelIndex]?.collected ?? 0} / ${this.levelStats[this.levelIndex]?.total ?? 0}`;
    this.ui.livesValue.textContent = String(this.lives);
    this.ui.bestValue.textContent = String(this.bestScore);
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
