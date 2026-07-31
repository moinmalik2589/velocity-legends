import Phaser from "phaser";

export class UIButton {

    constructor(scene, x, y, text, callback, width = 220, height = 60) {

        this.scene = scene;
        this.callback = callback;
        this.enabled = true;

        this.container = scene.add.container(x, y);

        this.background = scene.add.rectangle(
            0,
            0,
            width,
            height,
            0x1976D2
        );

        this.background.setStrokeStyle(2, 0x00D4FF);

        this.label = scene.add.text(
            0,
            0,
            text,
            {
                fontFamily: "Arial",
                fontSize: "26px",
                color: "#FFFFFF",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        this.container.add([
            this.background,
            this.label
        ]);

        this.hitArea = new Phaser.Geom.Rectangle(
            -width / 2,
            -height / 2,
            width,
            height
        );

        this.container.setSize(width, height);

        this.container.setInteractive(
            this.hitArea,
            Phaser.Geom.Rectangle.Contains
        );

        this.container.on("pointerover", () => {

            if (!this.enabled) return;

            this.background.setFillStyle(0x2196F3);

        });

        this.container.on("pointerout", () => {

            this.container.setScale(1);

            this.background.setFillStyle(0x1976D2);

        });

        this.container.on("pointerdown", () => {

            if (!this.enabled) return;

            this.container.setScale(0.96);

            if (this.callback) {
                this.scene.time.delayedCall(60, () => {

                    if (this.enabled) {

                        this.callback();

                    }

                    this.container.setScale(1);

                });

            }

        });

    }

    setText(text) {

        this.label.setText(text);

    }

    setEnabled(enabled) {

        this.enabled = enabled;

        this.container.disableInteractive();

        if (enabled) {

            this.container.setInteractive(
                this.hitArea,
                Phaser.Geom.Rectangle.Contains
            );

            this.background.setAlpha(1);

        } else {

            this.background.setAlpha(0.5);

        }

    }

    setVisible(visible) {

        this.container.setVisible(visible);

    }

    destroy() {

        this.container.destroy();

    }

}