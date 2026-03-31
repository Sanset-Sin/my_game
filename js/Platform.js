export class Platform {
  constructor({ x, y, width, height, type = 'solid' }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#d8d1c4';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = '#c5bdaf';
    ctx.fillRect(this.x, this.y, this.width, 10);

    ctx.strokeStyle = 'rgba(74, 90, 84, 0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
}
