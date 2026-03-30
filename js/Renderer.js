export class Renderer {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawBackground(cameraX) {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#f4efe6');
    gradient.addColorStop(1, '#e6dfd1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const hillShiftA = -(cameraX * 0.12) % (this.width * 1.2);
    const hillShiftB = -(cameraX * 0.25) % (this.width * 1.1);

    ctx.fillStyle = 'rgba(167, 191, 174, 0.45)';
    for (let i = -1; i <= 2; i += 1) {
      const x = hillShiftA + i * this.width * 1.1;
      ctx.beginPath();
      ctx.moveTo(x, this.height);
      ctx.quadraticCurveTo(x + 160, 260, x + 340, this.height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(125, 164, 141, 0.25)';
    for (let i = -1; i <= 2; i += 1) {
      const x = hillShiftB + i * this.width;
      ctx.beginPath();
      ctx.moveTo(x, this.height);
      ctx.quadraticCurveTo(x + 180, 310, x + 390, this.height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#a7bfae';
    ctx.fillRect(0, this.height - 44, this.width, 44);
  }

  drawOverlay(messageTitle, messageText) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(244, 239, 230, 0.72)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = 'rgba(246, 242, 232, 0.98)';
    ctx.strokeStyle = 'rgba(125, 164, 141, 0.38)';
    ctx.lineWidth = 1;
    const w = 450;
    const h = 170;
    const x = (this.width - w) / 2;
    const y = (this.height - h) / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#44564d';
    ctx.font = '700 30px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(messageTitle, this.width / 2, y + 58);

    ctx.fillStyle = '#6f7e75';
    ctx.font = '400 18px Inter, sans-serif';
    ctx.fillText(messageText, this.width / 2, y + 100);
    ctx.fillText('Нажми R для рестарта или Start для нового забега.', this.width / 2, y + 136);
    ctx.restore();
  }
}
