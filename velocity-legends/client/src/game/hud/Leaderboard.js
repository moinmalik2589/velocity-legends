import Phaser from "phaser";

export class Leaderboard {

    constructor(scene, player, aiCars) {

        this.scene = scene;
        this.player = player;
        this.aiCars = aiCars;

        this.text = scene.add.text(
            scene.scale.width - 20,
            120,
            "",
            {
                fontFamily: "Arial",
                fontSize: "22px",
                color: "#FFFFFF",
                backgroundColor: "#000000",
                padding: {
                    left: 10,
                    right: 10,
                    top: 8,
                    bottom: 8
                }
            }
        );

        this.text
            .setOrigin(1, 0)
            .setScrollFactor(0);

    }

    progress(car) {

        return (
            car.lap * 100000 +
            car.currentWaypoint * 1000
        );

    }

    update() {

        const racers = [

            {
                name: "YOU",
                car: this.player
            },

            ...this.aiCars.map((car, index) => ({
                name: `AI ${index + 1}`,
                car
            }))

        ];

        racers.sort(
            (a, b) =>
                this.progress(b.car) -
                this.progress(a.car)
        );

        let text = "LEADERBOARD\n\n";

        racers.forEach((racer, index) => {

            text += `${index + 1}. ${racer.name}\n`;

        });

        this.text.setText(text);

    }

}