export class InputHandler {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();

    window.addEventListener('keydown', (event) => {
      const code = event.code;
      if ([
        'ArrowLeft', 'ArrowRight', 'ArrowUp',
        'KeyA', 'KeyD', 'KeyW', 'Space', 'KeyP'
      ].includes(code)) {
        event.preventDefault();
      }
      if (!this.keys.has(code)) {
        this.justPressed.add(code);
      }
      this.keys.add(code);
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
  }

  isDown(...codes) {
    return codes.some((code) => this.keys.has(code));
  }

  consumePress(...codes) {
    const hit = codes.some((code) => this.justPressed.has(code));
    codes.forEach((code) => this.justPressed.delete(code));
    return hit;
  }

  endFrame() {
    this.justPressed.clear();
  }
}
