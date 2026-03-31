export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
  }

  draw(game) {
    const { ctx, canvas } = this;
    const { level, cameraX, player } = game;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawSky(level.sky, level.backdrop, cameraX);
    this.drawSolids(level.solids, cameraX, canvas.width);
    this.drawDecor(level.decor, cameraX, canvas.width);
    this.drawHazards(level.hazards, cameraX, canvas.width);
    this.drawCollectibles(level.collectibles, cameraX, canvas.width, game.time);
    this.drawPortal(level.portal, cameraX, level.portalPulse);
    this.drawPlayer(player, cameraX);
  }

  inView(x, width, cameraX, canvasWidth, margin = 80) {
    return x + width >= cameraX - margin && x <= cameraX + canvasWidth + margin;
  }

  drawSky(sky, backdrop, cameraX) {
    const { ctx, canvas } = this;
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.beginPath();
    ctx.arc(120, 88, 52, 0, Math.PI * 2);
    ctx.arc(720, 66, 40, 0, Math.PI * 2);
    ctx.fill();

    const shift = cameraX * 0.16;
    ctx.fillStyle = backdrop;
    for (let i = -1; i < 7; i += 1) {
      const x = i * 240 - (shift % 240);
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.lineTo(x + 100, 332);
      ctx.lineTo(x + 220, canvas.height);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawSolids(solids, cameraX, canvasWidth) {
    const { ctx } = this;
    for (const solid of solids) {
      if (!this.inView(solid.x, solid.width, cameraX, canvasWidth)) continue;
      const x = Math.round(solid.x - cameraX);
      const y = solid.y;

      if (solid.type === 'ground') {
        ctx.fillStyle = '#d2c09f';
        ctx.fillRect(x, y, solid.width, solid.height);
        ctx.fillStyle = '#98b38a';
        ctx.fillRect(x, y, solid.width, 8);
        ctx.fillStyle = 'rgba(75,86,72,0.06)';
        for (let i = 12; i < solid.width - 12; i += 28) {
          ctx.fillRect(x + i, y + 18, 14, Math.max(14, solid.height - 34));
        }
      } else if (solid.type === 'bench') {
        ctx.fillStyle = '#a98362';
        ctx.fillRect(x, y, solid.width, solid.height);
        ctx.fillRect(x + 4, y - 8, solid.width - 8, 6);
        ctx.fillStyle = '#8a674d';
        ctx.fillRect(x + 8, y + solid.height, 6, 18);
        ctx.fillRect(x + solid.width - 14, y + solid.height, 6, 18);
      } else if (solid.type === 'wall') {
        ctx.fillStyle = '#c7b9a1';
        ctx.fillRect(x, y, solid.width, solid.height);
        ctx.fillStyle = 'rgba(255,255,255,0.32)';
        ctx.fillRect(x + 5, y + 6, 6, solid.height - 12);
      } else {
        ctx.fillStyle = '#d9cfbc';
        ctx.fillRect(x, y, solid.width, solid.height);
        ctx.strokeStyle = 'rgba(75,86,72,0.14)';
        ctx.strokeRect(x + 0.5, y + 0.5, solid.width - 1, solid.height - 1);
      }
    }
  }

  drawDecor(decor, cameraX, canvasWidth) {
    const { ctx } = this;
    for (const item of decor) {
      if (!this.inView(item.x, 56, cameraX, canvasWidth)) continue;
      const x = Math.round(item.x - cameraX);
      const y = item.y;
      if (item.kind === 'bush') {
        ctx.fillStyle = '#8eab83';
        ctx.beginPath();
        ctx.arc(x + 10, y + 14, 10, 0, Math.PI * 2);
        ctx.arc(x + 24, y + 11, 13, 0, Math.PI * 2);
        ctx.arc(x + 40, y + 14, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.kind === 'benchBack') {
        ctx.fillStyle = '#b29170';
        ctx.fillRect(x + 4, y + 2, 34, 5);
        ctx.fillRect(x + 4, y + 10, 34, 5);
        ctx.fillRect(x + 6, y + 15, 4, 18);
        ctx.fillRect(x + 32, y + 15, 4, 18);
      }
    }
  }

  drawHazards(hazards, cameraX, canvasWidth) {
    const { ctx } = this;
    for (const hazard of hazards) {
      if (!this.inView(hazard.x, hazard.width, cameraX, canvasWidth)) continue;
      const x = Math.round(hazard.x - cameraX);
      if (hazard.type === 'spikes') {
        ctx.fillStyle = '#bf7f6d';
        if (hazard.orientation === 'left' || hazard.orientation === 'right') {
          const count = Math.max(2, Math.floor(hazard.height / 14));
          const step = hazard.height / count;
          for (let i = 0; i < count; i += 1) {
            ctx.beginPath();
            if (hazard.orientation === 'left') {
              ctx.moveTo(x + hazard.width, hazard.y + i * step);
              ctx.lineTo(x, hazard.y + i * step + step / 2);
              ctx.lineTo(x + hazard.width, hazard.y + (i + 1) * step);
            } else {
              ctx.moveTo(x, hazard.y + i * step);
              ctx.lineTo(x + hazard.width, hazard.y + i * step + step / 2);
              ctx.lineTo(x, hazard.y + (i + 1) * step);
            }
            ctx.closePath();
            ctx.fill();
          }
        } else {
          const count = Math.max(1, Math.floor(hazard.width / 14));
          const step = hazard.width / count;
          for (let i = 0; i < count; i += 1) {
            ctx.beginPath();
            ctx.moveTo(x + i * step, hazard.y + hazard.height);
            ctx.lineTo(x + i * step + step / 2, hazard.y);
            ctx.lineTo(x + (i + 1) * step, hazard.y + hazard.height);
            ctx.closePath();
            ctx.fill();
          }
        }
      } else if (hazard.type === 'flyer') {
        ctx.fillStyle = '#bf7f6d';
        ctx.fillRect(x, hazard.y + 7, hazard.width, hazard.height - 10);
        ctx.fillStyle = '#98b38a';
        ctx.fillRect(x + 8, hazard.y + 2, hazard.width - 16, 5);
      }
    }
  }

  drawCollectibles(items, cameraX, canvasWidth, time) {
    const { ctx } = this;
    for (const item of items) {
      if (item.collected || !this.inView(item.x - 10, 20, cameraX, canvasWidth)) continue;
      const x = item.x - cameraX;
      const y = item.y + Math.sin(time * 3 + item.phase) * 3;
      ctx.fillStyle = '#d8be72';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.72)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawPortal(portal, cameraX, pulse) {
    const { ctx } = this;
    const x = portal.x - cameraX;
    ctx.strokeStyle = '#96abc4';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, portal.y, portal.width, portal.height);
    ctx.fillStyle = `rgba(150,171,196,${0.16 + Math.sin(pulse) * 0.06 + 0.08})`;
    ctx.fillRect(x + 4, portal.y + 4, portal.width - 8, portal.height - 8);
  }

  drawPlayer(player, cameraX) {
    const { ctx } = this;
    const cx = player.centerX - cameraX;
    const cy = player.centerY;
    const spin = (player.x * 0.018) % (Math.PI * 2);
    ctx.fillStyle = '#6f907d';
    ctx.beginPath();
    ctx.arc(cx, cy, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 5, 6, spin, spin + Math.PI * 1.35);
    ctx.stroke();
  }
}
