export class UIPanel {

    constructor(scene, x, y, width, height) {

        this.scene = scene;

        this.panel = scene.add.rectangle(
            x,
            y,
            width,
            height,
            0x1A2332
        );

        this.panel
            .setStrokeStyle(2, 0x00D4FF)
            .setAlpha(0.95);
    }

    setVisible(value) {
        this.panel.setVisible(value);
    }

    destroy() {
        this.panel.destroy();
    }

}