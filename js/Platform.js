export class Platform {
  constructor(x, y, width, height, type = 'solid') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  draw(ctx, cameraX, isGoalActive = true) {
    const screenX = this.x - cameraX;

    if (this.type === 'goal') {
      ctx.save();
      ctx.fillStyle = '#a7bfae';
      ctx.fillRect(screenX + this.width - 6, this.y - 92, 6, 92 + this.height);
      ctx.fillStyle = isGoalActive ? '#7da48d' : '#d7c8a2';
      ctx.beginPath();
      ctx.moveTo(screenX, this.y - 90);
      ctx.lineTo(screenX + 46, this.y - 72);
      ctx.lineTo(screenX, this.y - 54);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(68, 86, 77, 0.18)';
      ctx.fillRect(screenX, this.y, this.width, this.height);
      ctx.restore();
      return;
    }

    if (this.type === 'hazard') {
      ctx.save();
      ctx.fillStyle = '#d7c8a2';
      const spikeCount = Math.max(2, Math.floor(this.width / 18));
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
    ctx.fillStyle = '#a7bfae';
    ctx.fillRect(screenX, this.y, this.width, this.height);
    ctx.fillStyle = 'rgba(246, 242, 232, 0.4)';
    ctx.fillRect(screenX, this.y, this.width, 5);
    ctx.restore();
  }
}
