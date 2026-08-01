export class Speedometer {

    constructor(scene, car) {

        this.scene = scene;
        this.car = car;

        this.label = scene.add.text(
            20,
            scene.scale.height - 70,
            "",
            {
                fontFamily: "Trebuchet MS, Arial, sans-serif",
                fontSize: "28px",
                color: "#FFFFFF",
                fontStyle: "bold"
            }
        );

        this.label.setScrollFactor(0);

    }

    update() {

        const speed = Math.max(
            0,
            Math.round(Math.abs(this.car.speed))
        );

        this.label.setText(
            `SPEED : ${speed} km/h`
        );

    }

}
