export class Countdown {

    constructor(scene) {

        this.scene = scene;

        this.finished = false;

        this.canDrive = false;

        this.value = 3;

        this.label = scene.add.text(
            scene.scale.width / 2,
            scene.scale.height / 2,
            "3",
            {
                fontFamily: "Arial",
                fontSize: "120px",
                color: "#FFD54F",
                fontStyle: "bold"
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0);

        scene.time.addEvent({

            delay: 1000,

            repeat: 3,

            callback: () => {

                this.value--;

                if (this.value > 0) {

                    this.label.setText(this.value);

                }
                else if (this.value === 0) {

                    this.label.setText("GO!");

                    this.canDrive = true;

                }
                else {

                    this.finished = true;

                    this.label.destroy();

                }

            }

        });

    }

}