export class Platform {
  constructor(x, y, width, height, type = 'solid') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;

    if (this.type === 'goal') {
      ctx.save();
      ctx.fillStyle = '#74f0d4';
      ctx.fillRect(screenX, this.y, this.width, this.height);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(screenX + this.width - 14, this.y - 80, 8, 80);
      ctx.beginPath();
      ctx.moveTo(screenX + this.width - 6, this.y - 80);
      ctx.lineTo(screenX + this.width + 34, this.y - 58);
      ctx.lineTo(screenX + this.width - 6, this.y - 38);
      ctx.closePath();
      ctx.fillStyle = '#ffd166';
      ctx.fill();
      ctx.restore();
      return;
    }

    if (this.type === 'hazard') {
      ctx.save();
      ctx.fillStyle = '#ff6b8b';
      const spikeCount = Math.max(2, Math.floor(this.width / 20));
      const spikeWidth = this.width / spikeCount;
      for (let i = 0; i < spikeCount; i += 1) {
        const baseX = screenX + i * spikeWidth;
        ctx.beginPath();
        ctx.moveTo(baseX, this.y + this.height);
        ctx.lineTo(baseX + spikeWidth / 2, this.y);
        ctx.lineTo(baseX + spikeWidth, this.y + this.height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.fillStyle = '#7ca7ff';
    ctx.fillRect(screenX, this.y, this.width, this.height);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(screenX, this.y, this.width, 6);
    ctx.restore();
  }
}
