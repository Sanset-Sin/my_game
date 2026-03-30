export class Collectible {
  constructor(x, y, radius = 10, value = 10) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.value = value;
    this.collected = false;
    this.floatOffset = Math.random() * Math.PI * 2;
  }

  draw(ctx, cameraX, time) {
    if (this.collected) return;

    const bob = Math.sin(time / 250 + this.floatOffset) * 4;
    const drawX = this.x - cameraX;
    const drawY = this.y + bob;

    ctx.save();
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = 'rgba(255, 209, 102, 0.6)';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(drawX - 3, drawY - 3, this.radius / 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
