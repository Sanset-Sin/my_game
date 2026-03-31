export class Player {
  constructor(spawn) {
    this.radius = 17;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.moveAcceleration = 1540;
    this.maxSpeedX = 325;
    this.groundFriction = 0.80;
    this.airFriction = 0.95;
    this.gravity = 2300;
    this.maxFallSpeed = 980;
    this.jumpVelocity = -700;
    this.bounce = 0.02;
    this.coyoteTimeMax = 0.12;
    this.jumpBufferMax = 0.12;
    this.reset(spawn);
  }

  reset(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
  }

  get centerX() { return this.x + this.radius; }
  get centerY() { return this.y + this.radius; }
  get bounds() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }

  update(input, dt) {
    const direction = (input.isRight() ? 1 : 0) - (input.isLeft() ? 1 : 0);
    if (direction !== 0) {
      const accel = this.onGround ? this.moveAcceleration : this.moveAcceleration * 0.62;
      this.vx += direction * accel * dt;
      this.facing = direction;
    } else {
      const friction = this.onGround ? this.groundFriction : this.airFriction;
      this.vx *= Math.pow(friction, dt * 60);
      if (Math.abs(this.vx) < 2.4) this.vx = 0;
    }

    this.vx = Math.max(-this.maxSpeedX, Math.min(this.maxSpeedX, this.vx));

    if (input.isJump()) {
      this.jumpBuffer = this.jumpBufferMax;
    } else {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    }

    if (this.onGround) this.coyoteTime = this.coyoteTimeMax;
    else this.coyoteTime = Math.max(0, this.coyoteTime - dt);

    if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
      this.vy = this.jumpVelocity;
      this.onGround = false;
      this.coyoteTime = 0;
      this.jumpBuffer = 0;
    }

    if (!input.isJump() && this.vy < -240) {
      this.vy += this.gravity * 0.55 * dt;
    }

    this.vy += this.gravity * dt;
    this.vy = Math.min(this.vy, this.maxFallSpeed);
  }
}
