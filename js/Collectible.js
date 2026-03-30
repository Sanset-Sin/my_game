export class Collectible {
  constructor(x, y, radius = 9, value = 10) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.value = value;
    this.collected = false;
    this.floatOffset = Math.random() * Math.PI * 2;
  }

  draw(ctx, cameraX, time) {
    if (this.collected) return;

    const bob = Math.sin(time / 300 + this.floatOffset) * 3;
    const drawX = this.x - cameraX;
    const drawY = this.y + bob;

    ctx.save();
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#d7c8a2';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(drawX - 2, drawY - 2, this.radius / 2.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.fill();
    ctx.restore();
  }
}
