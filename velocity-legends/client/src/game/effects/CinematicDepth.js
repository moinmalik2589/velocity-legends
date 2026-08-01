export class CinematicDepth {

    constructor(scene, player, aiCars) {
        this.scene = scene;
        this.cars = [player, ...aiCars];
        this.shadows = this.cars.map(car => {
            const shadow = scene.add.ellipse(car.sprite.x, car.sprite.y, 30, 8, 0x000000, 0.36);
            shadow.setDepth(4);
            return shadow;
        });
    }

    update() {
        this.cars.forEach((car, index) => {
            const sprite = car.sprite;
            const shadow = this.shadows[index];
            shadow.setPosition(sprite.x + 4, sprite.y + 6);
            shadow.setSize(Math.max(12, sprite.displayWidth * 0.85), Math.max(4, sprite.displayHeight * 0.18));
            shadow.setRotation(sprite.rotation);
            shadow.setAlpha(car.finished ? 0.12 : 0.34);
        });
    }
}
