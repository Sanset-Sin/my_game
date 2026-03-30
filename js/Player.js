export class Player {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.width = 42;
    this.height = 56;
    this.speed = 320;
    this.jumpForce = 720;
    this.gravity = 1800;
    this.maxFallSpeed = 980;
    this.friction = 0.82;
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
  }

  get bounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  handleInput(input, deltaTime) {
    const dt = deltaTime / 1000;
    const moveLeft = input.isLeftPressed();
    const moveRight = input.isRightPressed();
    const jumpPressed = input.isJumpPressed();

    if (moveLeft && !moveRight) {
      this.vx = -this.speed;
      this.facing = -1;
    } else if (moveRight && !moveLeft) {
      this.vx = this.speed;
      this.facing = 1;
    } else {
      this.vx *= Math.pow(this.friction, dt * 60);
      if (Math.abs(this.vx) < 10) this.vx = 0;
    }

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
    const drawX = this.x - cameraX;

    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(drawX + this.width / 2, this.y + this.height + 4, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#74f0d4';
    ctx.fillRect(drawX + 6, this.y + 8, this.width - 12, this.height - 8);

    ctx.fillStyle = '#eef3ff';
    ctx.fillRect(drawX + 10, this.y, this.width - 20, 18);

    ctx.fillStyle = '#0b1020';
    const eyeX = this.facing === 1 ? drawX + 24 : drawX + 14;
    ctx.fillRect(eyeX, this.y + 6, 6, 4);

    ctx.fillStyle = '#7ca7ff';
    ctx.fillRect(drawX + 4, this.y + 18, 10, 18);
    ctx.fillRect(drawX + this.width - 14, this.y + 18, 10, 18);

    ctx.fillStyle = '#ffd166';
    ctx.fillRect(drawX + 10, this.y + this.height - 12, 8, 12);
    ctx.fillRect(drawX + this.width - 18, this.y + this.height - 12, 8, 12);

    ctx.restore();
  }
}
