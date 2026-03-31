export class Platform {
  constructor(x, y, width, height, type = 'platform') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }
}
