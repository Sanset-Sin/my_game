export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  clear() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#fffaf2');
    sky.addColorStop(0.55, '#f1ebdf');
    sky.addColorStop(1, '#e7dece');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(146, 183, 163, 0.18)';
    ctx.beginPath();
    ctx.arc(140, 110, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(760, 70, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  drawParallax(cameraX) {
    const { ctx, canvas } = this;
    ctx.save();

    const slowShift = cameraX * 0.18;
    ctx.fillStyle = '#d9d1c3';
    for (let i = -1; i < 6; i += 1) {
      const x = i * 260 - slowShift % 260;
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.lineTo(x + 110, 310);
      ctx.lineTo(x + 230, canvas.height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#c9d9cf';
    const midShift = cameraX * 0.35;
    for (let i = -1; i < 7; i += 1) {
      const x = i * 180 - midShift % 180;
      ctx.fillRect(x, canvas.height - 120, 120, 120);
    }

    ctx.restore();
  }
}
