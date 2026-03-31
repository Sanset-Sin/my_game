import { Player } from './Player.js';
import { Platform } from './Platform.js';
import { Renderer } from './Renderer.js';
import { LEVELS } from './levels.js';
import { intersectsRect, circleRectCollision } from './Collision.js';

export class Game {
  constructor(canvas, ui, input) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.input = input;
    this.renderer = new Renderer(canvas, this.ctx);

    this.state = 'menu';
    this.cameraX = 0;
    this.levelIndex = 0;
    this.score = 0;
    this.bestScore = Number(localStorage.getItem('lost-signal-best') || 0);
    this.lives = 3;
    this.levelStartTime = 0;
    this.message = '';

    this.player = new Player({ x: 90, y: 420 });
    this.loadLevel(0, true);
    this.updateHUD();
    this.showOverlay(
      'Ламповый платформер',
      'Нажми «Старт»',
      'Собери все энергетические фрагменты, активируй портал и пройди три зоны. A/D или ←/→ — движение, W/Space/↑ — прыжок, P — пауза.'
    );
  }

  cloneLevel(index) {
    const source = LEVELS[index];
    return {
      ...source,
      platforms: source.platforms.map((p) => new Platform(p)),
      fragments: source.fragments.map((f) => ({ ...f })),
      spikes: source.spikes.map((s) => ({ ...s })),
      drones: source.drones.map((d) => ({ ...d, direction: 1 })),
      portal: { ...source.portal },
      spawn: { ...source.spawn },
      checkpoint: { ...source.checkpoint },
    };
  }

  loadLevel(index, resetScore = false) {
    this.levelIndex = index;
    this.level = this.cloneLevel(index);
    this.player.reset(this.level.spawn);
    this.cameraX = 0;
    this.portalUnlocked = false;
    this.levelStartTime = performance.now();
    if (resetScore) {
      this.score = 0;
      this.lives = 3;
    }
    this.message = `${this.level.name}. ${this.level.story}`;
    this.updateHUD();
  }

  start() {
    if (this.state === 'victory' || this.state === 'gameover') {
      this.restart();
      return;
    }
    this.state = 'running';
    this.hideOverlay();
  }

  togglePause() {
    if (this.state === 'running') {
      this.state = 'paused';
      this.showOverlay('Пауза', this.level.name, 'Игра остановлена. Нажми «Пауза» ещё раз или клавишу P, чтобы продолжить.');
    } else if (this.state === 'paused') {
      this.state = 'running';
      this.hideOverlay();
    }
  }

  restart() {
    this.loadLevel(0, true);
    this.state = 'menu';
    this.showOverlay(
      'Перезапуск',
      'Сигнал сброшен',
      'Все уровни пересобраны заново. Нажми «Старт» и попробуй пройти уже без красивых падений в шипы.'
    );
  }

  update(timestamp) {
    if (this.input.consumePress('KeyP')) {
      if (this.state === 'running' || this.state === 'paused') {
        this.togglePause();
      }
    }

    if (this.state !== 'running') {
      this.input.endFrame();
      return;
    }

    this.player.update(this.input);
    this.resolvePlatformCollisions();
    this.updateDrones();
    this.collectFragments();
    this.checkHazards();
    this.checkPortal(timestamp);
    this.updateCamera();
    this.updateHUD();
    this.input.endFrame();
  }

  resolvePlatformCollisions() {
    const player = this.player;
    player.onGround = false;

    for (const platform of this.level.platforms) {
      const bounds = player.bounds;
      const intersects = intersectsRect(bounds, platform);
      if (!intersects) continue;

      const prevBottom = bounds.y + bounds.height - player.vy;
      const prevTop = bounds.y - player.vy;
      const prevRight = bounds.x + bounds.width - player.vx;
      const prevLeft = bounds.x - player.vx;

      const platformTop = platform.y;
      const platformBottom = platform.y + platform.height;
      const platformLeft = platform.x;
      const platformRight = platform.x + platform.width;

      if (prevBottom <= platformTop && player.vy >= 0) {
        player.y = platformTop - player.radius;
        player.vy = 0;
        player.onGround = true;
      } else if (prevTop >= platformBottom && player.vy < 0) {
        player.y = platformBottom + player.radius;
        player.vy = 0;
      } else if (prevRight <= platformLeft && player.vx > 0) {
        player.x = platformLeft - player.radius;
        player.vx = 0;
      } else if (prevLeft >= platformRight && player.vx < 0) {
        player.x = platformRight + player.radius;
        player.vx = 0;
      }
    }
  }

  updateDrones() {
    for (const drone of this.level.drones) {
      drone.x += drone.speed * drone.direction;
      if (drone.x <= drone.minX || drone.x + drone.width >= drone.maxX) {
        drone.direction *= -1;
      }
    }
  }

  collectFragments() {
    for (const fragment of this.level.fragments) {
      if (fragment.collected) continue;
      const dx = this.player.x - fragment.x;
      const dy = this.player.y - fragment.y;
      if (dx * dx + dy * dy <= (this.player.radius + 12) ** 2) {
        fragment.collected = true;
        this.score += 10;
      }
    }

    this.portalUnlocked = this.level.fragments.every((fragment) => fragment.collected);
  }

  checkHazards() {
    if (this.player.invulnerability > 0) return;

    const playerCircle = { x: this.player.x, y: this.player.y, radius: this.player.radius };

    for (const spike of this.level.spikes) {
      if (circleRectCollision(playerCircle, spike)) {
        this.takeHit();
        return;
      }
    }

    for (const drone of this.level.drones) {
      if (intersectsRect(this.player.bounds, drone)) {
        this.takeHit();
        return;
      }
    }

    if (this.player.y - this.player.radius > this.canvas.height + 60) {
      this.takeHit(true);
    }
  }

  takeHit(fromFall = false) {
    this.lives -= 1;
    if (this.lives <= 0) {
      this.finishGame(false);
      return;
    }

    this.player.reset(this.level.checkpoint);
    this.player.invulnerability = 90;
    this.cameraX = Math.max(0, this.player.x - this.canvas.width * 0.35);
    this.message = fromFall ? 'Падение в пустоту. Ядро отброшено к контрольной точке.' : 'Слишком близко к ловушкам. Попробуй точнее.';
    this.updateHUD();
  }

  checkPortal(timestamp) {
    const portalRect = this.level.portal;
    if (!this.portalUnlocked) return;

    if (intersectsRect(this.player.bounds, portalRect)) {
      const elapsedSeconds = Math.floor((timestamp - this.levelStartTime) / 1000);
      const bonus = Math.max(20, this.level.timeBonus - elapsedSeconds * 3);
      this.score += bonus;

      if (this.levelIndex < LEVELS.length - 1) {
        const nextLevel = this.levelIndex + 1;
        this.loadLevel(nextLevel, false);
        this.state = 'paused';
        this.showOverlay(
          'Переход',
          LEVELS[nextLevel].name,
          `Уровень пройден. Бонус за скорость: +${bonus}. Нажми «Старт», чтобы войти в следующую зону.`
        );
      } else {
        this.finishGame(true, bonus);
      }
    }
  }

  finishGame(won, finalBonus = 0) {
    this.bestScore = Math.max(this.bestScore, this.score);
    localStorage.setItem('lost-signal-best', String(this.bestScore));
    this.updateHUD();

    if (won) {
      this.state = 'victory';
      this.showOverlay(
        'Финал',
        'Сигнал восстановлен',
        `Ты собрал(а) все фрагменты и активировал(а) ядро. Финальный бонус: +${finalBonus}. Итоговый счёт: ${this.score}.`
      );
    } else {
      this.state = 'gameover';
      this.showOverlay(
        'Поражение',
        'Ядро перегорело',
        `Жизни закончились. Итоговый счёт: ${this.score}. Нажми «Рестарт» и попробуй пройти уже без самоуничтожения.`
      );
    }
  }

  updateCamera() {
    const target = this.player.x - this.canvas.width * 0.35;
    const maxCamera = this.level.worldWidth - this.canvas.width;
    this.cameraX += (target - this.cameraX) * 0.08;
    this.cameraX = Math.max(0, Math.min(maxCamera, this.cameraX));
  }

  updateHUD() {
    this.ui.levelValue.textContent = `${this.levelIndex + 1} / ${LEVELS.length}`;
    this.ui.scoreValue.textContent = String(this.score);
    this.ui.livesValue.textContent = String(this.lives);
    this.ui.bestValue.textContent = String(Math.max(this.bestScore, this.score));
  }

  showOverlay(tag, title, text) {
    this.ui.overlayTag.textContent = tag;
    this.ui.overlayTitle.textContent = title;
    this.ui.overlayText.textContent = text;
    this.ui.overlay.classList.remove('hidden');
  }

  hideOverlay() {
    this.ui.overlay.classList.add('hidden');
  }

  draw() {
    const ctx = this.ctx;
    this.renderer.clear();
    this.renderer.drawParallax(this.cameraX);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    this.drawWorldDecor();
    this.level.platforms.forEach((platform) => platform.draw(ctx));
    this.drawSpikes();
    this.drawFragments();
    this.drawPortal();
    this.drawDrones();
    this.player.draw(ctx);

    ctx.restore();

    this.drawMessage();
  }

  drawWorldDecor() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(111, 150, 130, 0.16)';
    for (let i = 0; i < this.level.worldWidth; i += 260) {
      ctx.beginPath();
      ctx.arc(i + 80, 500, 44, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawFragments() {
    const ctx = this.ctx;
    for (const fragment of this.level.fragments) {
      if (fragment.collected) continue;
      ctx.save();
      ctx.translate(fragment.x, fragment.y);
      ctx.fillStyle = '#d8c66d';
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI / 3) * i;
        const radius = i % 2 === 0 ? 12 : 6;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawSpikes() {
    const ctx = this.ctx;
    for (const spike of this.level.spikes) {
      const teeth = Math.max(2, Math.floor(spike.width / 12));
      const toothWidth = spike.width / teeth;
      ctx.save();
      ctx.fillStyle = '#c98876';
      for (let i = 0; i < teeth; i += 1) {
        const x = spike.x + i * toothWidth;
        ctx.beginPath();
        ctx.moveTo(x, spike.y + spike.height);
        ctx.lineTo(x + toothWidth / 2, spike.y);
        ctx.lineTo(x + toothWidth, spike.y + spike.height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawPortal() {
    const ctx = this.ctx;
    const portal = this.level.portal;
    ctx.save();
    ctx.strokeStyle = this.portalUnlocked ? '#91a8c5' : 'rgba(145, 168, 197, 0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(portal.x, portal.y, portal.width, portal.height);
    ctx.fillStyle = this.portalUnlocked ? 'rgba(145, 168, 197, 0.28)' : 'rgba(145, 168, 197, 0.1)';
    ctx.fillRect(portal.x + 4, portal.y + 4, portal.width - 8, portal.height - 8);
    ctx.restore();
  }

  drawDrones() {
    const ctx = this.ctx;
    for (const drone of this.level.drones) {
      ctx.save();
      ctx.fillStyle = '#c98876';
      ctx.fillRect(drone.x, drone.y, drone.width, drone.height);
      ctx.fillStyle = '#fffaf2';
      ctx.fillRect(drone.x + 7, drone.y + 7, 8, 8);
      ctx.fillRect(drone.x + 27, drone.y + 7, 8, 8);
      ctx.restore();
    }
  }

  drawMessage() {
    if (!this.message) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 250, 242, 0.85)';
    ctx.strokeStyle = 'rgba(200, 189, 168, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const x = 18;
    const y = 18;
    const w = 440;
    const h = 50;
    ctx.roundRect(x, y, w, h, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a5a54';
    ctx.font = '500 15px Inter, sans-serif';
    ctx.fillText(this.message, 34, 48, 400);
    ctx.restore();
  }
}
