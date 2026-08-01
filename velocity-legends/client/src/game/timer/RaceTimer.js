export class RaceTimer {

    constructor(scene) {

        this.scene = scene;

        this.elapsed = 0;

        this.finished = false;

        this.label = scene.add.text(
            scene.scale.width / 2,
            66,
            "00:00.000",
            {
                fontFamily: "Trebuchet MS, Arial, sans-serif",
                fontSize: "30px",
                color: "#FFD54F",
                fontStyle: "bold"
            }
        );

        this.label
            .setOrigin(0.5, 0)
            .setScrollFactor(0);

    }

    update(delta) {

        if (this.finished) {

            return;

        }

        this.elapsed += delta;

        const minutes = Math.floor(this.elapsed / 60000);

        const seconds = Math.floor((this.elapsed % 60000) / 1000);

        const milliseconds = Math.floor(this.elapsed % 1000);

        this.label.setText(

            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`

        );

    }

    stop() {

        this.finished = true;

    }

}
