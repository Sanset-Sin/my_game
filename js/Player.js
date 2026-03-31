export class Player {
  constructor(spawn) {
    this.radius = 18;
    this.moveSpeed = 0.72;
    this.maxSpeed = 6;
    this.groundDrag = 0.8;
    this.airDrag = 0.92;
    this.gravity = 0.46;
    this.jumpForce = 11.5;
    this.maxFall = 12;
    this.invulnerability = 0;
    this.reset(spawn);
  }

  reset(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
  }

  get bounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }

  update(input) {
    const movingLeft = input.isDown('ArrowLeft', 'KeyA');
    const movingRight = input.isDown('ArrowRight', 'KeyD');

    if (movingLeft) this.vx -= this.moveSpeed;
    if (movingRight) this.vx += this.moveSpeed;

    if (!movingLeft && !movingRight) {
      this.vx *= this.onGround ? this.groundDrag : this.airDrag;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
    }

    this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));

    if (input.consumePress('ArrowUp', 'KeyW', 'Space') && this.onGround) {
      this.vy = -this.jumpForce;
      this.onGround = false;
    }

    this.vy += this.gravity;
    this.vy = Math.min(this.vy, this.maxFall);

    this.x += this.vx;
    this.y += this.vy;

    if (this.invulnerability > 0) {
      this.invulnerability -= 1;
    }
  }

  draw(ctx) {
    ctx.save();

    const blink = this.invulnerability > 0 && Math.floor(this.invulnerability / 5) % 2 === 0;
    ctx.globalAlpha = blink ? 0.45 : 1;

    const gradient = ctx.createRadialGradient(
      this.x - 4,
      this.y - 8,
      6,
      this.x,
      this.y,
      this.radius
    );
    gradient.addColorStop(0, '#f7fbf7');
    gradient.addColorStop(0.45, '#b7d0c2');
    gradient.addColorStop(1, '#6f9682');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(74, 90, 84, 0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}
