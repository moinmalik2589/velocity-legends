export class UILabel {

    constructor(scene, x, y, text, style = {}) {

        this.scene = scene;

        this.text = scene.add.text(
            x,
            y,
            text,
            {
                fontFamily: "Arial",
                fontSize: "24px",
                color: "#FFFFFF",
                ...style
            }
        );
    }

    setText(value) {
        this.text.setText(value);
    }

    setPosition(x, y) {
        this.text.setPosition(x, y);
    }

    setOrigin(x = 0.5, y = 0.5) {
        this.text.setOrigin(x, y);
        return this;
    }

    setVisible(value) {
        this.text.setVisible(value);
    }

    destroy() {
        this.text.destroy();
    }

}