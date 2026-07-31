export class VerticalScrollView {

    constructor(scene) {

        this.scene = scene;

        this.items = [];

        this.offsetY = 0;

        scene.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {

            this.offsetY -= deltaY * 0.35;

            this.offsetY = Phaser.Math.Clamp(
                this.offsetY,
                -600,
                0
            );

            this.refresh();

        });

    }

    add(gameObject) {

        this.items.push({
            object: gameObject,
            y: gameObject.y
        });

    }

    refresh() {

        this.items.forEach(item => {

            item.object.y = item.y + this.offsetY;

        });

    }

}