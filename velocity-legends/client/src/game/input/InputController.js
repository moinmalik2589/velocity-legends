import { MobileControls } from "./MobileControls.js";

export class InputController {

    constructor(scene) {

        this.keys = scene.input.keyboard.addKeys({
            up: "W",
            down: "S",
            left: "A",
            right: "D",
            nitro: "SHIFT",
            brake: "SPACE"
        });

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.mobile = scene.sys.game.device.input.touch ? new MobileControls(scene) : null;

    }

    up() {
        return this.keys.up.isDown || this.cursors.up.isDown || this.mobile?.up;
    }

    down() {
        return this.keys.down.isDown || this.cursors.down.isDown;
    }

    left() {
        return this.keys.left.isDown || this.cursors.left.isDown || this.mobile?.left;
    }

    right() {
        return this.keys.right.isDown || this.cursors.right.isDown || this.mobile?.right;
    }

    nitro() {
        return this.keys.nitro.isDown || this.mobile?.nitro;
    }

    brake() {
        return this.keys.brake.isDown;
    }

}
