export class Player {
  constructor(spawn) {
    this.radius = 18;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.moveAcceleration = 1700;
    this.maxSpeedX = 290;
    this.friction = 0.82;
    this.gravity = 1680;
    this.maxFallSpeed = 920;
    this.jumpVelocity = -610;
    this.bounce = 0.08;
    this.reset(spawn);
  }

  reset(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.jumpBuffer = 0;
  }

  get centerX() {
    return this.x + this.radius;
  }

  get centerY() {
    return this.y + this.radius;
  }

  get bounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  update(input, dt) {
    const direction = (input.isRight() ? 1 : 0) - (input.isLeft() ? 1 : 0);
    if (direction !== 0) {
      this.vx += direction * this.moveAcceleration * dt;
      this.facing = direction;
    } else {
      this.vx *= Math.pow(this.friction, dt * 60);
      if (Math.abs(this.vx) < 3) this.vx = 0;
    }

    this.vx = Math.max(-this.maxSpeedX, Math.min(this.maxSpeedX, this.vx));

    if (input.isJump()) {
      this.jumpBuffer = 0.12;
    } else {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    }

    if (this.jumpBuffer > 0 && this.onGround) {
      this.vy = this.jumpVelocity;
      this.onGround = false;
      this.jumpBuffer = 0;
    }

    this.vy += this.gravity * dt;
    this.vy = Math.min(this.vy, this.maxFallSpeed);
  }
}
