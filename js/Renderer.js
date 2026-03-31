export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(game) {
    const ctx = this.ctx;
    const { canvas } = this;
    const { level, cameraX, player } = game;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawSky(level.sky);
    this.drawBackdrop(level, cameraX);
    this.drawSolids(level.solids, cameraX);
    this.drawDecor(level.decor, cameraX);
    this.drawHazards(level.hazards, cameraX);
    this.drawCollectibles(level.collectibles, cameraX);
    this.drawPortal(level.portal, cameraX, level.portalPulse);
    this.drawPlayer(player, cameraX);
  }

  drawSky(sky) {
    const ctx = this.ctx;
    const { canvas } = this;
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(130, 90, 58, 0, Math.PI * 2);
    ctx.arc(760, 70, 42, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBackdrop(level, cameraX) {
    const ctx = this.ctx;
    const { canvas } = this;
    const mountainShift = cameraX * 0.2;
    ctx.fillStyle = level.backdrop;
    for (let i = -1; i < 7; i += 1) {
      const x = i * 220 - (mountainShift % 220);
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.lineTo(x + 90, 320);
      ctx.lineTo(x + 200, canvas.height);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawSolids(solids, cameraX) {
    const ctx = this.ctx;
    for (const solid of solids) {
      const x = Math.round(solid.x - cameraX);
      const y = solid.y;
      ctx.fillStyle = solid.type === 'ground' ? '#d4c3a1' : '#d8cfbc';
      ctx.fillRect(x, y, solid.width, solid.height);
      ctx.fillStyle = '#9bb98e';
      ctx.fillRect(x, y, solid.width, Math.min(8, solid.height));
      ctx.fillStyle = 'rgba(79,90,77,0.08)';
      ctx.fillRect(x + 8, y + 14, Math.max(0, solid.width - 16), Math.max(0, solid.height - 22));
    }
  }

  drawDecor(decor, cameraX) {
    const ctx = this.ctx;
    for (const item of decor) {
      const x = Math.round(item.x - cameraX);
      const y = item.y;
      if (item.kind === 'bush') {
        ctx.fillStyle = '#8fad86';
        ctx.beginPath();
        ctx.arc(x + 10, y + 10, 10, 0, Math.PI * 2);
        ctx.arc(x + 24, y + 8, 12, 0, Math.PI * 2);
        ctx.arc(x + 38, y + 11, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      if (item.kind === 'bench') {
        ctx.fillStyle = '#b78f6b';
        ctx.fillRect(x + 4, y + 10, 34, 6);
        ctx.fillRect(x + 6, y + 18, 4, 10);
        ctx.fillRect(x + 32, y + 18, 4, 10);
      }
    }
  }

  drawHazards(hazards, cameraX) {
    const ctx = this.ctx;
    for (const hazard of hazards) {
      const x = Math.round(hazard.x - cameraX);
      if (hazard.type === 'spikes') {
        ctx.fillStyle = '#cc8b7a';
        const spikeCount = Math.max(1, Math.floor(hazard.width / 16));
        const spikeWidth = hazard.width / spikeCount;
        for (let i = 0; i < spikeCount; i += 1) {
          ctx.beginPath();
          ctx.moveTo(x + i * spikeWidth, hazard.y + hazard.height);
          ctx.lineTo(x + i * spikeWidth + spikeWidth / 2, hazard.y);
          ctx.lineTo(x + (i + 1) * spikeWidth, hazard.y + hazard.height);
          ctx.closePath();
          ctx.fill();
        }
      } else if (hazard.type === 'flyer') {
        ctx.fillStyle = '#cc8b7a';
        ctx.fillRect(x, hazard.y + 7, hazard.width, hazard.height - 10);
        ctx.fillStyle = '#9bb98e';
        ctx.fillRect(x + 8, hazard.y + 2, hazard.width - 16, 5);
      }
    }
  }

  drawCollectibles(items, cameraX) {
    const ctx = this.ctx;
    for (const item of items) {
      if (item.collected) continue;
      const x = item.x - cameraX;
      const y = item.y + Math.sin(item.floatOffset) * 4;
      ctx.fillStyle = '#d6bd73';
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawPortal(portal, cameraX, pulse) {
    const ctx = this.ctx;
    const x = portal.x - cameraX;
    ctx.strokeStyle = '#91a8c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, portal.y, portal.width, portal.height);
    ctx.fillStyle = `rgba(145,168,199,${0.18 + pulse * 0.18})`;
    ctx.fillRect(x + 4, portal.y + 4, portal.width - 8, portal.height - 8);
  }

  drawPlayer(player, cameraX) {
    const ctx = this.ctx;
    const cx = player.centerX - cameraX;
    const cy = player.centerY;
    const spin = (player.x * 0.02) % (Math.PI * 2);

    ctx.fillStyle = '#6e9581';
    ctx.beginPath();
    ctx.arc(cx, cy, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 6, 6, spin, spin + Math.PI * 1.35);
    ctx.stroke();
  }
}
