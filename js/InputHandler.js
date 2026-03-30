export class InputHandler {
  constructor() {
    this.keys = new Set();

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      const trackedKeys = ['a', 'd', 'w', 'arrowleft', 'arrowright', 'arrowup', ' ', 'space'];

      if (trackedKeys.includes(key) || trackedKeys.includes(event.key)) {
        event.preventDefault();
      }

      this.keys.add(key === 'spacebar' ? ' ' : key);
    });

    window.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();
      this.keys.delete(key === 'spacebar' ? ' ' : key);
    });
  }

  isLeftPressed() {
    return this.keys.has('a') || this.keys.has('arrowleft');
  }

  isRightPressed() {
    return this.keys.has('d') || this.keys.has('arrowright');
  }

  isJumpPressed() {
    return this.keys.has('w') || this.keys.has('arrowup') || this.keys.has(' ') || this.keys.has('space');
  }
}
