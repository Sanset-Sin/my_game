export class Player {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.radius = 18;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.speed = 250;
    this.jumpForce = 600;
    this.gravity = 1500;
    this.maxFallSpeed = 860;
    this.groundDrag = 0.8;
    this.airDrag = 0.94;
    this.reset();
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.jumpBuffer = 0;
    this.coyoteTimer = 0;
    this.jumpLock = false;
    this.facing = 1;
    this.rotation = 0;
  }

  get bounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  get center() {
    return {
      x: this.x + this.radius,
      y: this.y + this.radius,
      radius: this.radius,
    };
  }

  handleInput(input, deltaTime) {
    const dt = deltaTime / 1000;
    const acceleration = this.onGround ? 2400 : 1650;
    const moveLeft = input.isLeftPressed();
    const moveRight = input.isRightPressed();
    const jumpPressed = input.isJumpPressed();

    if (moveLeft && !moveRight) {
      this.vx -= acceleration * dt;
      this.facing = -1;
    } else if (moveRight && !moveLeft) {
      this.vx += acceleration * dt;
      this.facing = 1;
    } else {
      const drag = this.onGround ? this.groundDrag : this.airDrag;
      this.vx *= Math.pow(drag, dt * 60);
      if (Math.abs(this.vx) < 6) this.vx = 0;
    }

    this.vx = Math.max(-this.speed, Math.min(this.speed, this.vx));

    if (jumpPressed) {
      this.jumpBuffer = 0.14;
    } else {
      this.jumpLock = false;
    }
  }

  update(deltaTime) {
    const dt = deltaTime / 1000;

    if (this.jumpBuffer > 0) this.jumpBuffer -= dt;
    if (this.coyoteTimer > 0) this.coyoteTimer -= dt;

    if (this.jumpBuffer > 0 && !this.jumpLock && (this.onGround || this.coyoteTimer > 0)) {
      this.vy = -this.jumpForce;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpBuffer = 0;
      this.jumpLock = true;
    }

    this.vy += this.gravity * dt;
    if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += (this.vx / Math.max(1, this.speed)) * 0.12;
  }

  landOn(y) {
    this.y = y - this.height;
    this.vy = 0;
    this.onGround = true;
    this.coyoteTimer = 0.12;
  }

  leaveGround() {
    if (this.onGround) {
      this.coyoteTimer = 0.12;
    }
    this.onGround = false;
  }

  draw(ctx, cameraX) {
    const drawX = this.x - cameraX + this.radius;
    const drawY = this.y + this.radius;

    ctx.save();

    ctx.fillStyle = 'rgba(72, 92, 88, 0.18)';
    ctx.beginPath();
    ctx.ellipse(drawX, this.y + this.height + 4, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(drawX, drawY);
    ctx.rotate(this.rotation);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#7da48d';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-5, -6, this.radius * 0.52, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.facing * 5, -2, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = '#f6f2e8';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.facing * 6, -2, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#44564d';
    ctx.fill();

    ctx.restore();
  }
}
