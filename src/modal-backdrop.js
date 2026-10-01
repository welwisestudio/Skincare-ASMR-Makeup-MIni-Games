import * as Phaser from 'phaser';

// Keep one frozen view for a whole modal journey. Nested rewards and ad previews
// share it, so opening another dialog never compounds the darkness or blur.
const SCREENS = new Set(['levels', 'playing', 'result', 'bonus', 'collection']);

export function installModalBackdrop(UI) {
  Object.assign(UI.prototype, {
    isModal(mode = this.mode) { return !SCREENS.has(mode); },
    prepareModalBackdrop(mode) {
      if (!this.isModal(mode)) {
        this.modalBackdrop?.destroy();
        this.modalBackdrop = null;
        return;
      }
      if (this.modalBackdrop || !this.root.list.length) return;
      this.modalSourceMode = this.mode;
      const { width, height } = this.scale;
      const snapshot = this.add.renderTexture(0, 0, width, height).setOrigin(0).setDepth(-2);
      const game = this.app.scene;
      const layers = [game?.background, game?.root, this.backdrop, this.root, this.effects]
        .filter(layer => layer?.visible);
      snapshot.draw(layers);
      if (this.game.renderer.type === Phaser.WEBGL) {
        snapshot.postFX.addBlur(2, this.app.pixelRatio, this.app.pixelRatio, 1, 0xffffff, 6);
      } else {
        // Canvas renderer fallback: blur only the captured pixels, never UI text.
        const canvas = snapshot.texture.canvas, copy = document.createElement('canvas');
        copy.width = canvas.width; copy.height = canvas.height;
        copy.getContext('2d').drawImage(canvas, 0, 0);
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save(); context.filter = `blur(${8 * this.app.pixelRatio}px)`;
        context.drawImage(copy, 0, 0); context.restore();
      }
      this.modalBackdrop = snapshot;
    },
    resizeModalBackdrop() {
      if (!this.modalBackdrop || !this.isModal()) return;
      const mode = this.mode;
      // Recompose the underlying screen at its new layout before capturing it.
      // Both renders happen in the same frame; no blank texture is presented.
      this.mode = this.modalSourceMode;
      this.render(false);
      this.prepareModalBackdrop(mode);
      this.mode = mode;
    },
    drawModalBackdrop() {
      if (!this.isModal()) {
        this.modalBackdrop?.destroy(); this.modalBackdrop = null;
        return;
      }
      const { width, height } = this.scale, snapshot = this.modalBackdrop;
      if (snapshot) {
        // Cover the viewport on rotation without recreating an empty framebuffer.
        const scale = Math.max(width / snapshot.width, height / snapshot.height);
        snapshot.setScale(scale).setPosition((width - snapshot.width * scale) / 2, (height - snapshot.height * scale) / 2);
      }
      this.scrim.fillStyle(0x101218, .54).fillRect(0, 0, width, height);
    },
  });
}
