export class Renderer {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawBackground(cameraX, levelLength) {
    const ctx = this.ctx;

    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#172343');
    gradient.addColorStop(0.55, '#101a32');
    gradient.addColorStop(1, '#0a1020');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const parallaxSlow = -(cameraX * 0.2) % this.width;
    const parallaxFast = -(cameraX * 0.45) % this.width;

    for (let i = -1; i <= 2; i += 1) {
      const offsetSlow = parallaxSlow + i * this.width;
      const offsetFast = parallaxFast + i * this.width;

      ctx.fillStyle = 'rgba(124, 167, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(offsetSlow, this.height);
      ctx.lineTo(offsetSlow + 120, 280);
      ctx.lineTo(offsetSlow + 250, this.height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(116, 240, 212, 0.08)';
      ctx.beginPath();
      ctx.moveTo(offsetFast + 140, this.height);
      ctx.lineTo(offsetFast + 260, 240);
      ctx.lineTo(offsetFast + 430, this.height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 50; i += 1) {
      const x = (i * 137 - cameraX * 0.1) % (levelLength + this.width);
      const y = 24 + (i * 37) % 180;
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.fillStyle = '#0f1730';
    ctx.fillRect(0, this.height - 44, this.width, 44);
  }

  drawOverlay(messageTitle, messageText) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(4, 9, 20, 0.56)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = 'rgba(14, 23, 45, 0.96)';
    ctx.strokeStyle = 'rgba(124, 167, 255, 0.24)';
    ctx.lineWidth = 1;
    const w = 430;
    const h = 170;
    const x = (this.width - w) / 2;
    const y = (this.height - h) / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#eef3ff';
    ctx.font = '700 30px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(messageTitle, this.width / 2, y + 58);

    ctx.fillStyle = '#9bacd8';
    ctx.font = '400 18px Inter, sans-serif';
    ctx.fillText(messageText, this.width / 2, y + 100);
    ctx.fillText('Нажми R для рестарта или Start для нового забега.', this.width / 2, y + 136);
    ctx.restore();
  }
}
