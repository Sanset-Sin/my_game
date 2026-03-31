export class InputHandler {
  constructor() {
    this.keys = new Set();

    window.addEventListener('keydown', (event) => {
      this.keys.add(event.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
  }

  isLeft() {
    return this.keys.has('KeyA') || this.keys.has('ArrowLeft');
  }

  isRight() {
    return this.keys.has('KeyD') || this.keys.has('ArrowRight');
  }

  isJump() {
    return this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.keys.has('Space');
  }

  isPausePressed() {
    return this.keys.has('KeyP');
  }
}
